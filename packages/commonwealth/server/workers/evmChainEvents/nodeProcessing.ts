import { EvmSource } from './types';
import { StatsDController } from 'common-common/src/statsd';
import models from '../../database';
import { getEvents } from './logProcessing';
import { emitChainEventNotifs } from './emitChainEventNotifs';
import { getEventSources } from './getEventSources';
import { rollbar } from './startEvmPolling';
import { factory, formatFilename } from 'common-common/src/logging';

const log = factory.getLogger(formatFilename(__filename));

/**
 * Given a ChainNode id and event sources, this function fetches all events parsed since
 * the last stored block number and then emits notifications for each of them before updating
 * the last fetched block number. This function will never throw an error.
 */
export async function processChainNode(
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

    const startBlockNum = startBlock?.block_number
      ? startBlock.block_number + 1
      : null;

    const { events, lastBlockNum } = await getEvents(evmSource, startBlockNum);

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
export async function scheduleNodeProcessing(
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
