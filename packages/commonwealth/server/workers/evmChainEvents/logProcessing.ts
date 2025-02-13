import { Log } from '@ethersproject/providers';
import { logger as _logger, stats } from '@hicommonwealth/core';
import { chainEventMappers } from '@hicommonwealth/model';
import { EventPair, EventPairs } from '@hicommonwealth/schemas';
import { ethers } from 'ethers';
import { config } from '../../config';
import { ContractSources, EvmBlockDetails, EvmSource } from './types';

const logger = _logger(import.meta);

/**
 * Converts a string or integer number into a hexadecimal string that adheres to the following guidelines
 * https://ethereum.org/en/developers/docs/apis/json-rpc/#quantities-encoding
 * @param decimal
 */
function decimalToHex(decimal: number | string) {
  if (decimal == '0') {
    return '0x0';
  } else {
    return ethers.utils.hexStripZeros(
      ethers.BigNumber.from(decimal).toHexString(),
    );
  }
}

export function getProvider(rpc: string) {
  return new ethers.providers.JsonRpcProvider(rpc);
}

/**
 * Fetches logs from the given EVM source. startingBlockNum can be used to start fetching logs
 * from a specific block number. If startingBlockNum is more than 500 blocks behind the current
 * block number then shorten the range to 500 blocks.
 */
export async function getLogs({
  rpc,
  maxBlockRange,
  contractAddresses,
  startingBlockNum,
  endingBlockNum,
}: {
  rpc: string;
  maxBlockRange: number;
  contractAddresses: string[];
  startingBlockNum: number;
  endingBlockNum: number;
}): Promise<{
  logs: Log[];
  lastBlockNum: number;
  blockDetails: Record<number, EvmBlockDetails>;
}> {
  let startBlock = startingBlockNum;
  const provider = getProvider(rpc);

  if (startBlock > endingBlockNum) {
    logger.error(
      'Starting block number is greater than the latest/current block number!',
      undefined,
      {
        startBlock,
        endingBlockNum,
      },
    );
    return { logs: [], lastBlockNum: endingBlockNum, blockDetails: {} };
  }

  if (contractAddresses.length === 0) {
    logger.error(`No contracts given`);
    return { logs: [], lastBlockNum: endingBlockNum, blockDetails: {} };
  }

  // limit the number of blocks to fetch to avoid rate limiting on some public EVM nodes like Celo
  // maxBlockRange = -1 indicates there is no block range limit
  if (maxBlockRange !== -1 && endingBlockNum - startBlock > maxBlockRange) {
    startBlock = endingBlockNum - maxBlockRange;
    logger.error(
      'Block span too large. The number of fetch blocked is reduced to 500.',
      undefined,
      {
        contractAddresses,
        startBlock,
        endingBlockNum,
      },
    );
  }

  // TODO: use Web3.JS instead
  const logs: Array<{
    address: string;
    blockHash: string;
    blockNumber: string;
    data: string;
    logIndex: string;
    removed: boolean;
    topics: string[];
    transactionHash: string;
    transactionIndex: string;
  }> = await provider.send('eth_getLogs', [
    {
      fromBlock: decimalToHex(startBlock),
      toBlock: decimalToHex(endingBlockNum),
      address: contractAddresses,
    },
  ]);

  const blockNumbers = [...new Set(logs.map((l) => l.blockNumber))];
  const blockDetails = await Promise.all(
    blockNumbers.map(async (blockNumber) => {
      const block = await provider.send('eth_getBlockByNumber', [
        blockNumber,
        false,
      ]);
      return {
        number: parseInt(block.number, 16),
        hash: block.hash,
        logsBloom: block.logsBloom,
        parentHash: block.parentHash,
        miner: block.miner,
        nonce: block.nonce ? block.nonce.toString() : undefined,
        timestamp: parseInt(block.timestamp, 16),
        gasLimit: parseInt(block.gasLimit, 16),
        gasUsed: parseInt(block.gasUsed, 16),
      } as EvmBlockDetails;
    }),
  );

  const formattedLogs: Log[] = logs.map((log) => ({
    ...log,
    blockNumber: parseInt(log.blockNumber, 16),
    transactionIndex: parseInt(log.transactionIndex, 16),
    logIndex: parseInt(log.logIndex, 16),
  }));

  return {
    logs: formattedLogs,
    lastBlockNum: endingBlockNum,
    blockDetails: blockDetails.reduce((map, details) => {
      map[details.number] = details;
      return map;
    }, {}),
  };
}

export async function parseLogs(
  sources: ContractSources,
  logs: Log[],
  blockDetails: Record<number, EvmBlockDetails>,
): Promise<Array<EventPairs>> {
  const events: Array<EventPairs> = [];

  for (const log of logs) {
    const address = ethers.utils.getAddress(log.address);
    const evmEventSources = sources[address];
    if (!evmEventSources) {
      logger.error('Missing event sources', undefined, {
        // should be logged even if address is undefined -> do not shorten
        address: `${address}`,
        sourceContracts: Object.keys(sources),
      });
      continue;
    }

    const evmEventSource = evmEventSources.find(
      (s) => s.event_signature === log.topics[0],
    );
    if (!evmEventSource) continue;

    const eventMapper = chainEventMappers[evmEventSource.event_signature];
    if (!eventMapper) {
      logger.error('Missing event mapper', undefined, {
        eventSignature: evmEventSource.event_signature,
        contractAddress: address,
      });
      continue;
    }

    try {
      events.push(
        eventMapper({
          eventSource: {
            ethChainId: evmEventSource.eth_chain_id,
            eventSignature: evmEventSource.event_signature,
          },
          rawLog: log,
          block: blockDetails[log.blockNumber],
        }) as EventPair<any>,
      );
    } catch (e) {
      const msg = `Failed to map log from contract ${address} with signature ${log.topics[0]}`;
      logger.error(msg, e);
      continue;
    }
    stats().increment('ce.evm.event', {
      contractAddress: address,
    });
  }

  return events;
}

export async function getEvents(
  evmSource: EvmSource,
  startingBlockNum: number,
  endingBlockNum: number,
): Promise<{ events: Array<EventPairs>; lastBlockNum: number }> {
  const { logs, lastBlockNum, blockDetails } = await getLogs({
    rpc: evmSource.rpc,
    maxBlockRange: evmSource.maxBlockRange,
    contractAddresses: Object.keys(evmSource.contracts),
    startingBlockNum,
    endingBlockNum,
  });

  const events = await parseLogs(evmSource.contracts, logs, blockDetails);
  return {
    events,
    lastBlockNum,
  };
}

/**
 * This function is used to migrate recently added EvmEventSources to the
 * indicated end block. This is used when new event sources are added as a
 * result of other events being processed. Generally, this will be used in a
 * pattern where we listen for contract creation events that when processed
 * create new EvmEventSources derived from the created contract.
 */
export async function migrateEvents(
  evmSource: EvmSource,
  endingBlockNum: number,
): Promise<
  | {
      events: Array<EventPairs>;
      lastBlockNum: number;
      contracts: ContractSources;
    }
  | { contracts: ContractSources }
> {
  let oldestBlock: number | undefined;
  const contracts: ContractSources = {};
  for (const [contractAddress, evmEventSource] of Object.entries(
    evmSource.contracts,
  )) {
    for (const source of evmEventSource) {
      if (source.created_at_block && source.events_migrated === false) {
        if (!contracts[contractAddress]) {
          contracts[contractAddress] = [];
        }
        contracts[contractAddress].push(source);
        if (!oldestBlock || oldestBlock > source.created_at_block) {
          oldestBlock = source.created_at_block;
        }
      }
    }
  }

  if (Object.keys(contracts).length > 0 && oldestBlock) {
    const result = await getEvents(
      {
        rpc: evmSource.rpc,
        maxBlockRange: evmSource.maxBlockRange,
        contracts,
      },
      oldestBlock,
      endingBlockNum,
    );
    config.WORKERS.EVM_CE_TRACE &&
      logger.warn('Events migrated', {
        startingBlockNum: oldestBlock,
        endingBlockNum,
      });
    return {
      events: result.events,
      lastBlockNum: result.lastBlockNum,
      contracts,
    };
  } else {
    config.WORKERS.EVM_CE_TRACE && logger.info('No events to migrate');
    return { contracts };
  }
}
