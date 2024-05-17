import {
  ChainEventSigs,
  ContestContentAdded,
  ContestContentUpvoted,
  ContestStarted,
  EventNames,
  OneOffContestManagerDeployed,
  RecurringContestManagerDeployed,
  events as coreEvents,
  parseEvmEventToContestEvent,
  stats,
} from '@hicommonwealth/core';
import { logger } from '@hicommonwealth/logging';
import { DB, emitEvent } from '@hicommonwealth/model';
import { ethers } from 'ethers';
import { fileURLToPath } from 'url';
import { z } from 'zod';
import { getEventSources } from './getEventSources';
import { getEvents, getProvider, migrateEvents } from './logProcessing';
import { EvmEvent, EvmSource } from './types';

const __filename = fileURLToPath(import.meta.url);
const log = logger(__filename);

const EvmContestEventSignatures = {
  NewContest:
    '0x990f533044dbc89b838acde9cd2c72c400999871cf8f792d731edcae15ead693',
  NewRecurringContestStarted:
    '0x32391ebd47fc736bb885d21a45d95c3da80aef6987aa90a5c6e747e9bc755bc9',
  NewSingleContestStarted:
    '0x002817006cf5e3f9ac0de6817ca39830ac7e731a4949a59e4ac3c8bef988b20c',
  ContentAdded:
    '0x2f0d66b98c7708890a982e2194479b066a117a6f9a8f418f7f14c6001965b78b',
  VoterVoted:
    '0xba2ce2b4fab99c4186fd3e0a8e93ffb61e332d0c4709bd01d01e7ac60631437a',
};

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

      const contestEvents = events
        .map((event) => {
          const timestamp = new Date(); // TODO: get block timestamp
          const contractAddress = ethers.utils.getAddress(event.rawLog.address);

          const parseEvent = (e: keyof typeof ChainEventSigs) =>
            parseEvmEventToContestEvent(
              e,
              contractAddress,
              timestamp,
              event.parsedArgs,
            );

          switch (event.eventSource.eventSignature) {
            case EvmContestEventSignatures.NewContest:
              return parseEvent('NewContest') as
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
              return parseEvent('NewRecurringContestStarted') as {
                event_name: EventNames.ContestStarted;
                event_payload: z.infer<typeof ContestStarted>;
              };
            case EvmContestEventSignatures.NewSingleContestStarted:
              return parseEvent('NewSingleContestStarted') as {
                event_name: EventNames.ContestStarted;
                event_payload: z.infer<typeof ContestStarted>;
              };
            case EvmContestEventSignatures.ContentAdded:
              return parseEvent('ContentAdded') as {
                event_name: EventNames.ContestContentAdded;
                event_payload: z.infer<typeof ContestContentAdded>;
              };
            case EvmContestEventSignatures.VoterVoted:
              return parseEvent('VoterVoted') as {
                event_name: EventNames.ContestContentUpvoted;
                event_payload: z.infer<typeof ContestContentUpvoted>;
              };
          }

          return null;
        })
        .filter(Boolean);

      await emitEvent(models.Outbox, contestEvents, transaction);

      if (allEvents.length > 0) {
        const records = allEvents.map(
          (
            event,
          ): {
            event_name: EventNames.ChainEventCreated;
            event_payload: z.infer<typeof coreEvents.ChainEventCreated>;
          } => ({
            event_name: EventNames.ChainEventCreated,
            event_payload: event as z.infer<
              typeof coreEvents.ChainEventCreated
            >,
          }),
        );
        await emitEvent(models.Outbox, records, transaction);
      }
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
