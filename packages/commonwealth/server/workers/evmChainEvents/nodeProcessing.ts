import { logger, stats } from '@hicommonwealth/core';
import { DB, NotificationInstance } from '@hicommonwealth/model';
import { emitChainEventNotifs } from './emitChainEventNotifs';
import { getEventSources } from './getEventSources';
import { getEvents, migrateEvents } from './logProcessing';
import { EvmSource, RawEvmEvent } from './types';

const log = logger().getLogger(__filename);

/**
 * Given a ChainNode id and event sources, this function fetches all events parsed since
 * the last stored block number and then emits notifications for each of them before updating
 * the last fetched block number. This function will never throw an error.
 */
export async function processChainNode(
  models: DB,
  chainNodeId: number,
  evmSource: EvmSource,
): Promise<Promise<void | NotificationInstance>[] | void> {
  try {
    log.info(
      'Processing:\n' +
        `\tchainNodeId: ${chainNodeId}\n` +
        `\tcontracts: ${JSON.stringify(Object.keys(evmSource.contracts))}`,
    );
    stats().increment('ce.evm.chain_node_id', {
      chainNodeId: String(chainNodeId),
    });

    const startBlock = await models.LastProcessedEvmBlock.findOne({
      where: {
        chain_node_id: chainNodeId,
      },
    });

    const startBlockNum = startBlock?.block_number
      ? startBlock.block_number + 1
      : null;

    const allEvents: RawEvmEvent[] = [];
    const migratedData = await migrateEvents(evmSource, startBlockNum);
    if (migratedData) allEvents.concat(migratedData.events);

    const { events, lastBlockNum } = await getEvents(evmSource, startBlockNum);
    allEvents.concat(events);
    const promises = await emitChainEventNotifs(chainNodeId, allEvents);

    if (!startBlock) {
      await models.LastProcessedEvmBlock.create({
        chain_node_id: chainNodeId,
        block_number: lastBlockNum,
      });
    } else {
      startBlock.block_number = lastBlockNum;
      await startBlock.save();
    }

    log.info(
      `Processed ${events.length} events for chainNodeId ${chainNodeId}`,
    );

    return promises;
  } catch (e) {
    const msg = `Error occurred while processing chainNodeId ${chainNodeId}`;
    log.error(msg, e);
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
export async function scheduleNodeProcessing(
  models: DB,
  interval: number,
  processFn: (
    models: DB,
    chainNodeId: number,
    sources: EvmSource,
  ) => Promise<Promise<void | NotificationInstance>[] | void>,
) {
  const evmSources = await getEventSources(models);

  const numEvmSources = Object.keys(evmSources).length;
  if (!numEvmSources) {
    return;
  }

  const chainNodeIds = Object.keys(evmSources);
  const betweenInterval = interval / numEvmSources;

  chainNodeIds.forEach((chainNodeId, index) => {
    const delay = index * betweenInterval;

    setTimeout(async () => {
      const promises = await processFn(
        models,
        +chainNodeId,
        evmSources[chainNodeId],
      );
      if (promises) {
        await Promise.allSettled(promises);
      }
    }, delay);
  });
}
