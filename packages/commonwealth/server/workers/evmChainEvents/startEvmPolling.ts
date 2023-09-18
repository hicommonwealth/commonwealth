import { getEvents } from './logs';
import models from '../../database';
import { EvmSource, RawEvmEvent } from './types';
import { QueryTypes } from 'sequelize';
import { getEventSources } from './getEventSources';
import emitNotifications from '../../util/emitNotifications';
import { NotificationDataAndCategory } from 'types';
import { NotificationCategories } from 'common-common/src/types';
import { ChainAttributes } from '../../models/chain';
import { ContractAttributes } from '../../models/contract';
import { SupportedNetwork } from 'chain-events/src';
import { factory, formatFilename } from 'common-common/src/logging';
import { StatsDController } from 'common-common/src/statsd';
import Rollbar from 'rollbar';
import { ROLLBAR_ENV, ROLLBAR_SERVER_TOKEN } from '../../config';

const log = factory.getLogger(formatFilename(__filename));

// TODO: @Timothee @Jake can we make this a util singleton for easy across the server?
export const rollbar = new Rollbar({
  accessToken: ROLLBAR_SERVER_TOKEN,
  environment: ROLLBAR_ENV,
  captureUncaught: true,
  captureUnhandledRejections: true,
});

async function emitChainEventNotifs(
  chainNodeId: number,
  events: RawEvmEvent[]
): Promise<void> {
  if (!events.length) {
    return;
  }

  const queryFilter: [string, number][] = events.map((event) => [
    event.contractAddress,
    chainNodeId,
  ]);

  const chainData: {
    chain_id: ChainAttributes['id'];
    chain_network: ChainAttributes['network'];
    contract_address: ContractAttributes['address'];
    chain_node_id: ContractAttributes['chain_node_id'];
  }[] = await models.sequelize.query(
    `
    SELECT CH.id as chain_id, CH.network as chain_network, C.address as contract_address, C.chain_node_id
    FROM "Contracts" C
             JOIN "CommunityContracts" CC on C.id = CC.contract_id
             JOIN "Chains" CH ON CC.chain_id = CH.id
    WHERE (C.address, C.chain_node_id) IN (?);
  `,
    { type: QueryTypes.SELECT, raw: true, replacements: [queryFilter] }
  );

  for (const event of events) {
    const chain = chainData.find(
      (c) =>
        c.contract_address === event.contractAddress &&
        c.chain_node_id === chainNodeId
    );

    const notification: NotificationDataAndCategory = {
      categoryId: NotificationCategories.ChainEvent,
      data: {
        chain: chain.chain_id,
        network: chain.chain_network as unknown as SupportedNetwork,
        block_number: event.blockNumber,
        event_data: {
          kind: event.kind,
          // TODO: @Timothee for now all event sources have proposal id as the first argument in the future
          //  we will store raw arguments and use the custom labeling system when pulling/viewing event notifications
          // use toString to accommodate for open zeppelin gov (impact market) proposal id's which are hashes
          id: event.args[0].toString(),
        },
      },
    };
    emitNotifications(models, notification).catch((e) => {
      const msg = `Error occurred while emitting a chain-event notification for event: ${JSON.stringify(
        event,
        null,
        2
      )}`;
      log.error(msg, e);
      rollbar.error(msg, e);
    });
  }
}

async function processChainNode(
  chainNodeId: number,
  evmSource: EvmSource
): Promise<void> {
  try {
    log.info(
      'Processing:\n' +
        `\tchainNodeId: ${chainNodeId}\n` +
        `\tcontracts: ${JSON.stringify(Object.keys(evmSource.contracts))}`
    );
    StatsDController.get().increment('ce.evm.chain_node_id', {
      chainNodeId: String(chainNodeId),
    });
    const startBlock = await models.LastProcessedEvmBlock.findOne({
      where: {
        chain_node_id: chainNodeId,
      },
    });

    const { events, lastBlockNum } = await getEvents(
      evmSource,
      startBlock?.block_number
    );

    await emitChainEventNotifs(chainNodeId, events);

    if (!startBlock) {
      await models.LastProcessedEvmBlock.create({
        chain_node_id: chainNodeId,
        block_number: lastBlockNum,
      });
    } else {
      startBlock.block_number = lastBlockNum;
      startBlock.save();
    }

    log.info(
      `Processed ${events.length} events for chainNodeId ${chainNodeId}`
    );
  } catch (e) {
    const msg = `Error occurred while processing chainNodeId ${chainNodeId}`;
    log.error(msg, e);
    rollbar.critical(msg, e);
  }
}

/**
 * Schedules processFn execution for each chainNode RPC in eventRpcSources. processFn execution is scheduled
 * evenly across the interval time so that blocks are not fetched all at once for all chainNodes. For example,
 * if there are 2 chainNodes and the interval is 4000ms, then processFn will be called for chainNode1 at T=0ms
 * and at T=2000ms and for chainNode2.
 * @param interval Time in milliseconds between each fetch of a ChainNode's blocks
 * @param processFn WARNING: must never throw an error. Errors thrown by processFn will not be caught.
 */
export async function scheduleBlockFetching(
  interval: number,
  processFn: (chainNodeId: number, sources: EvmSource) => Promise<void>
) {
  const evmSources = await getEventSources();

  const numEvmSources = Object.keys(evmSources).length;
  if (!numEvmSources) {
    return;
  }

  const chainNodeIds = Object.keys(evmSources);
  const betweenInterval = interval / numEvmSources;

  chainNodeIds.forEach((chainNodeId, index) => {
    const delay = index * betweenInterval;

    setTimeout(() => {
      processFn(+chainNodeId, evmSources[chainNodeId]);
    }, delay);
  });
}

/**
 * Starts an infinite loop that periodically fetches and parses blocks from
 * relevant EVM blockchains. Events parsed from these blocks are emitted
 * as chain-event notifications. The interval between each fetch is specified in milliseconds and should be
 * no more than 500k ms (500 seconds) so that we support any EVM chain that has an average block time of
 * 1 second or more (block fetching is limited to 500 blocks per interval). The recommended interval
 * is 120_000 ms (120 seconds) to avoid issues with public EVM nodes rate limiting requests.
 */
export async function startEvmPolling(interval: number) {
  log.info(`Starting EVM poller`);
  if (interval > 500_000) {
    throw new Error(
      `Interval for EVM polling must be at least 500_000 ms (500 seconds)`
    );
  }

  log.info(
    `All chains will be polled for events every ${interval / 1000} seconds`
  );
  scheduleBlockFetching(interval, processChainNode);
  setInterval(scheduleBlockFetching, interval, interval, processChainNode);
}

if (require.main === module) {
  startEvmPolling(120_000).catch((e) => {
    console.error(e);
    log.error('Evm poller shutting down due to a critical error:', e);
    rollbar.critical('Evm poller shutting down due to a critical error:', e);
    process.exit(1);
  });
}
