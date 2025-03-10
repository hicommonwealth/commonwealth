import { logger as _logger, stats } from '@hicommonwealth/core';
import {
  EvmBlockDetails,
  EvmChainSource,
  EvmContractSources,
  EvmEvent,
  Log,
  chainEventMappers,
} from '@hicommonwealth/model';
import { EventPairs } from '@hicommonwealth/schemas';
import { createPublicClient, getAddress, http } from 'viem';
import { config } from '../../config';

const logger = _logger(import.meta);

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

  const client = createPublicClient({
    transport: http(rpc),
  });
  const logs: Log[] = (await client.getLogs({
    address: <`0x${string}`[]>contractAddresses,
    fromBlock: BigInt(startBlock),
    toBlock: BigInt(endingBlockNum),
  })) as Log[];

  const blockNumbers = [...new Set(logs.map((l) => l.blockNumber))];
  const blockDetails = await Promise.all(
    blockNumbers.map(async (blockNumber) => {
      const block = await client.getBlock({
        blockNumber: blockNumber,
      });
      return {
        number: block.number,
        hash: block.hash,
        logsBloom: block.logsBloom,
        parentHash: block.parentHash,
        miner: block.miner,
        nonce: block.nonce ? block.nonce.toString() : undefined,
        timestamp: block.timestamp,
        gasLimit: block.gasLimit,
      };
    }),
  );

  return {
    logs,
    lastBlockNum: endingBlockNum,
    blockDetails: blockDetails.reduce((map, details) => {
      map[String(details.number)] = details;
      return map;
    }, {}),
  };
}

export async function parseLogs(
  sources: EvmContractSources,
  logs: Log[],
  blockDetails: Record<number, EvmBlockDetails>,
): Promise<Array<EventPairs>> {
  const events: Array<EventPairs> = [];

  for (const log of logs) {
    const address = getAddress(log.address);
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

    const eventMapper = evmEventSource.meta.event_name
      ? chainEventMappers[evmEventSource.meta.event_name]
      : chainEventMappers[evmEventSource.event_signature];
    if (!eventMapper) {
      logger.error('Missing event mapper', undefined, {
        eventSignature: evmEventSource.event_signature,
        contractAddress: address,
      });
      continue;
    }

    const evmEvent: EvmEvent = {
      eventSource: {
        ethChainId: evmEventSource.eth_chain_id,
        eventSignature: evmEventSource.event_signature,
      },
      rawLog: log,
      block: blockDetails[String(log.blockNumber)],
      meta: evmEventSource.meta,
    };
    try {
      events.push(eventMapper(evmEvent) as EventPairs);
    } catch (e) {
      const msg = `Failed to map log from contract ${address} with signature ${log.topics[0]}`;
      logger.error(msg, e, evmEvent);
      continue;
    }
    stats().increment('ce.evm.event', {
      contractAddress: address,
    });
  }

  return events;
}

export async function getEvents(
  evmSource: EvmChainSource,
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
  evmSource: EvmChainSource,
  endingBlockNum: number,
): Promise<
  | {
      events: Array<EventPairs>;
      lastBlockNum: number;
      contracts: EvmContractSources;
    }
  | { contracts: EvmContractSources }
> {
  let oldestBlock: number | undefined;
  const contracts: EvmContractSources = {};
  for (const [contractAddress, evmEventSource] of Object.entries(
    evmSource.contracts,
  )) {
    for (const source of evmEventSource) {
      if (source.meta.events_migrated === false) {
        if (!contracts[contractAddress]) {
          contracts[contractAddress] = [];
        }
        contracts[contractAddress].push(source);
        if (!oldestBlock || oldestBlock > source.meta.created_at_block) {
          oldestBlock = source.meta.created_at_block;
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
