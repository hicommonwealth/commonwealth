import {
  ChainEventSigs,
  ContestContentAdded,
  ContestContentUpvoted,
  ContestStarted,
  EventNames,
  EvmContestEventSignatures,
  EvmNamespaceFactoryEventSignatures,
  OneOffContestManagerDeployed,
  RecurringContestManagerDeployed,
  events as coreEvents,
  logger,
  parseEvmEventToContestEvent,
  stats,
} from '@hicommonwealth/core';
import { DB, emitEvent } from '@hicommonwealth/model';
import { ethers } from 'ethers';
import { fileURLToPath } from 'url';
import { z } from 'zod';
import { getEventSources } from './getEventSources';
import { getEvents, getProvider, migrateEvents } from './logProcessing';
import { EvmEvent, EvmSource } from './types';

const __filename = fileURLToPath(import.meta.url);
const log = logger(__filename);

/**
 * Given a ChainNode id and event sources, this function fetches all events parsed since
 * the last stored block number and then emits notifications for each of them before updating
 * the last fetched block number. This function will never throw an error.
 */
export async function processChainNode(
  models: DB,
  chainNodeId: number,
  evmSource: EvmSource,
): Promise<void> {
  try {
    log.info(
      'Processing:\n' +
        `\tchainNodeId: ${chainNodeId}\n` +
        `\tcontracts: ${JSON.stringify(Object.keys(evmSource.contracts))}`,
    );
    stats().increment('ce.evm.chain_node_id', {
      chainNodeId: String(chainNodeId),
    });

    const lastProcessedBlock = await models.LastProcessedEvmBlock.findOne({
      where: {
        chain_node_id: chainNodeId,
      },
    });

    const provider = getProvider(evmSource.rpc);
    const currentBlock = await provider.getBlockNumber();

    let startBlockNum: number;
    if (lastProcessedBlock?.block_number < currentBlock) {
      startBlockNum = lastProcessedBlock?.block_number + 1;
    } else if (lastProcessedBlock?.block_number === undefined) {
      startBlockNum = currentBlock - 10;
    } else {
      // the last processed block is the same as the current block
      // this occurs if the poll interval is shorter than the block time
      return;
    }

    const allEvents: EvmEvent[] = [];
    const migratedData = await migrateEvents(evmSource, startBlockNum);
    if (migratedData?.events?.length > 0)
      allEvents.push(...migratedData.events);

    const { events, lastBlockNum } = await getEvents(evmSource, startBlockNum);
    allEvents.push(...events);

    await models.sequelize.transaction(async (transaction) => {
      if (!lastProcessedBlock) {
        await models.LastProcessedEvmBlock.create(
          {
            chain_node_id: chainNodeId,
            block_number: lastBlockNum,
          },
          { transaction },
        );
      } else if (lastProcessedBlock.block_number !== lastBlockNum) {
        lastProcessedBlock.block_number = lastBlockNum;
        await lastProcessedBlock.save({ transaction });
      }

      if (allEvents.length === 0) {
        log.info(`Processed 0 events for chainNodeId ${chainNodeId}`);
        return;
      }

      const records = allEvents.map((event) => {
        const contractAddress = ethers.utils.getAddress(event.rawLog.address);

        const parseContestEvent = (e: keyof typeof ChainEventSigs) =>
          parseEvmEventToContestEvent(e, contractAddress, event.parsedArgs);

        switch (event.eventSource.eventSignature) {
          case EvmNamespaceFactoryEventSignatures.NewContest:
            return parseContestEvent('NewContest') as
              | {
                  event_name: EventNames.RecurringContestManagerDeployed;
                  event_payload: z.infer<
                    typeof RecurringContestManagerDeployed
                  >;
                }
              | {
                  event_name: EventNames.OneOffContestManagerDeployed;
                  event_payload: z.infer<typeof OneOffContestManagerDeployed>;
                };
          case EvmContestEventSignatures.NewRecurringContestStarted:
            return parseContestEvent('NewRecurringContestStarted') as {
              event_name: EventNames.ContestStarted;
              event_payload: z.infer<typeof ContestStarted>;
            };
          case EvmContestEventSignatures.NewSingleContestStarted:
            return parseContestEvent('NewSingleContestStarted') as {
              event_name: EventNames.ContestStarted;
              event_payload: z.infer<typeof ContestStarted>;
            };
          case EvmContestEventSignatures.ContentAdded:
            return parseContestEvent('ContentAdded') as {
              event_name: EventNames.ContestContentAdded;
              event_payload: z.infer<typeof ContestContentAdded>;
            };
          case EvmContestEventSignatures.VoterVoted:
            return parseContestEvent('VoterVoted') as {
              event_name: EventNames.ContestContentUpvoted;
              event_payload: z.infer<typeof ContestContentUpvoted>;
            };
        }

        // fallback to generic chain event
        return {
          event_name: EventNames.ChainEventCreated,
          event_payload: event as z.infer<typeof coreEvents.ChainEventCreated>,
        } as {
          event_name: EventNames.ChainEventCreated;
          event_payload: z.infer<typeof coreEvents.ChainEventCreated>;
        };
      });

      await emitEvent(models.Outbox, records, transaction);
    });

    log.info(
      `Processed ${allEvents.length} events for chainNodeId ${chainNodeId}`,
    );
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
  ) => Promise<void>,
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
      await processFn(models, +chainNodeId, evmSources[chainNodeId]);
    }, delay);
  });
}
