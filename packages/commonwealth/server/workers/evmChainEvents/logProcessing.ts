import { logger as _logger, stats } from '@hicommonwealth/core';
import { ChainEventBase } from '@hicommonwealth/evm-protocols';
import {
  createPublicClient,
  decodeEventLog,
  getAddress,
  http,
  Log,
} from 'viem';
import { z } from 'zod';
import { config } from '../../config';
import {
  EvmChainSource,
  EvmContractSources,
  EvmEventMeta,
} from './getEventSources';

const ALCHEMY_BLOCK_LIMIT = 9_000;

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
  logs: (Log & { blockTimestamp: string })[];
  lastBlockNum: number;
}> {
  let startBlock = startingBlockNum;
  let endBlock = endingBlockNum;
  if (startBlock > endBlock) {
    logger.error(
      'Starting block number is greater than the latest/current block number!',
      undefined,
      {
        startBlock,
        endBlock,
      },
    );
    return { logs: [], lastBlockNum: endBlock };
  }

  if (contractAddresses.length === 0) {
    logger.error(`No contracts given`);
    return { logs: [], lastBlockNum: endBlock };
  }

  // Limit the number of blocks to fetch to avoid rate limiting on some public EVM nodes like Celo
  // maxBlockRange = -1 indicates there is no rate limiting (though chunking
  // may still be required - see the next condition)
  if (maxBlockRange !== -1 && endBlock - startBlock > maxBlockRange) {
    startBlock = endBlock - maxBlockRange;
    logger.error(
      'Block span too large. The number of fetch blocked is reduced to 500.',
      undefined,
      {
        contractAddresses,
        startBlock,
        endBlock,
      },
    );
  } else if (
    maxBlockRange === -1 &&
    endBlock - startBlock > ALCHEMY_BLOCK_LIMIT
  ) {
    // For Alchemy nodes where we won't get rate limited we just need to go through
    // all the blocks but in chunks of 9k (max is 10k).
    // This is different from the case above which increases the startBlock (skipping blocks)
    endBlock = startBlock + ALCHEMY_BLOCK_LIMIT;
    logger.trace(`Reduced block range to 9k: ${startBlock} to ${endBlock}`);
  }

  const client = createPublicClient({
    transport: http(rpc),
  });
  const logs: Log[] = (await client.getLogs({
    address: <`0x${string}`[]>contractAddresses,
    fromBlock: BigInt(startBlock),
    toBlock: BigInt(endBlock),
  })) as Log[];

  return {
    logs,
    lastBlockNum: endBlock,
  };
}

export type EvmEventPayload = {
  event_name: string;
  args: unknown;
  eth_chain_id: number;
  event_signature: string;
  raw_log: Log;
  block: unknown;
  meta: EvmEventMeta;
};

export async function parseLogs(
  sources: EvmContractSources,
  logs: (Log & { blockTimestamp: string })[],
) {
  const events: z.infer<typeof ChainEventBase> = [];

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

    const evmEventSource = evmEventSources.event_sources.find(
      (s) => s.event_signature === log.topics[0],
    );
    if (!evmEventSource) continue;

    const decoded = decodeEventLog({
      abi: evmEventSources.abi,
      eventName: evmEventSource.event_name,
      topics: log.topics,
      data: log.data,
    });

    events.push({
      parsedArgs: decoded.args,
      eth_chain_id: evmEventSources.eth_chain_id,
      event_name: `${evmEventSources.contract_name}.${decoded.eventName}`,
      block_number: log.blockNumber,
      block_timestamp: parseInt(log.blockTimestamp, 16),
      contract_address: log.address,
      transaction_hash: log.transactionHash,
    });
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
): Promise<{ events; lastBlockNum: number }> {
  const { logs, lastBlockNum } = await getLogs({
    rpc: evmSource.rpc,
    maxBlockRange: evmSource.maxBlockRange,
    contractAddresses: Object.keys(evmSource.contracts),
    startingBlockNum,
    endingBlockNum,
  });

  const events = await parseLogs(evmSource.contracts, logs);
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
      events;
      lastBlockNum: number;
      contracts: EvmContractSources;
    }
  | { contracts: EvmContractSources }
> {
  let oldestBlock: number | undefined;
  const contracts = {};
  for (const [contractAddress, evmEventSource] of Object.entries(
    evmSource.contracts,
  )) {
    for (const source of evmEventSource.event_sources) {
      if (!source.meta.events_migrated) {
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
    logger.info('Events migrated', {
      startingBlockNum: oldestBlock,
      endingBlockNum,
    });
    return {
      events: result.events,
      lastBlockNum: result.lastBlockNum,
      contracts,
    };
  } else {
    config.EVM_CE.LOG_TRACE && logger.debug('No events to migrate');
    return { contracts };
  }
}
