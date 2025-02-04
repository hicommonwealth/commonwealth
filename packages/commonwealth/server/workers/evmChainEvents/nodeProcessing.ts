import {
  logger,
  parseEvmEventToContestEvent,
  stats,
} from '@hicommonwealth/core';
import {
  ChainEventSigs,
  EvmEventSignatures,
} from '@hicommonwealth/evm-protocols';
import { emitEvent, models } from '@hicommonwealth/model';
import { EventNames, events as coreEvents } from '@hicommonwealth/schemas';
import { ethers } from 'ethers';
import { z } from 'zod';
import { config } from '../../config';
import { getEventSources } from './getEventSources';
import { getEvents, getProvider, migrateEvents } from './logProcessing';
import { EvmEvent, EvmSource } from './types';

const log = logger(import.meta);

/**
 * Given a ChainNode id and event sources, this function fetches all events parsed since
 * the last stored block number and then emits notifications for each of them before updating
 * the last fetched block number. This function will never throw an error.
 */
export async function processChainNode(
  ethChainId: number,
  evmSource: EvmSource,
): Promise<void> {
  try {
    config.WORKERS.EVM_CE_TRACE &&
      log.warn(
        'Processing:\n' +
          `\tchainNodeId: ${ethChainId}\n` +
          `\tcontracts: ${JSON.stringify(Object.keys(evmSource.contracts))}`,
      );
    stats().increment('ce.evm.chain_node_id', {
      chainNodeId: String(ethChainId),
    });

    const chainNode = await models.ChainNode.findOne({
      where: {
        eth_chain_id: ethChainId,
      },
    });
    if (!chainNode) {
      log.error(`ChainNode not found - ETH chain id: ${ethChainId}`);
      return;
    }

    const lastProcessedBlock = await models.LastProcessedEvmBlock.findOne({
      where: {
        chain_node_id: chainNode.id!,
      },
    });

    const provider = getProvider(evmSource.rpc);
    const currentBlock = await provider.getBlockNumber();

    let startBlockNum: number;
    if (!lastProcessedBlock) {
      startBlockNum = currentBlock - 10;
    } else if (lastProcessedBlock.block_number === currentBlock - 1) {
      // last processed block number is the same as the most recent block
      // that EVM CE will process (-1 to avoid chain the majority of re-orgs)
      return;
    } else if (lastProcessedBlock.block_number + 1 <= currentBlock - 1) {
      // the next block evm ce is ready to process is less than or equal to
      // the most recent block that EVM CE will process
      startBlockNum = lastProcessedBlock.block_number + 1;
    } else {
      // the next block evm ce is ready to process is greater than the most
      // recent available block minus 1
      return;
    }

    const allEvents: EvmEvent[] = [];
    const migratedData = await migrateEvents(evmSource, startBlockNum);
    if (migratedData && migratedData?.events?.length > 0)
      allEvents.push(...migratedData.events);

    const { events, lastBlockNum } = await getEvents(
      evmSource,
      startBlockNum,
      currentBlock - 1,
    );
    allEvents.push(...events);

    await models.sequelize.transaction(async (transaction) => {
      if (!lastProcessedBlock) {
        await models.LastProcessedEvmBlock.create(
          {
            chain_node_id: chainNode.id!,
            block_number: lastBlockNum,
          },
          { transaction },
        );
      } else if (lastProcessedBlock.block_number !== lastBlockNum) {
        lastProcessedBlock.block_number = lastBlockNum;
        await lastProcessedBlock.save({ transaction });
      }

      if (allEvents.length === 0) {
        // log.info(`Processed 0 events for chainNodeId ${ethChainId}`);
        return;
      }

      const records = allEvents.map((event) => {
        const contractAddress = ethers.utils.getAddress(event.rawLog.address);

        const parseContestEvent = (e: keyof typeof ChainEventSigs) =>
          parseEvmEventToContestEvent(e, contractAddress, event.parsedArgs);

        switch (event.eventSource.eventSignature) {
          case EvmEventSignatures.NamespaceFactory.ContestManagerDeployed:
            return parseContestEvent('NewContest') as
              | {
                  event_name: EventNames.RecurringContestManagerDeployed;
                  event_payload: z.infer<
                    typeof coreEvents.RecurringContestManagerDeployed
                  >;
                }
              | {
                  event_name: EventNames.OneOffContestManagerDeployed;
                  event_payload: z.infer<
                    typeof coreEvents.OneOffContestManagerDeployed
                  >;
                };
          case EvmEventSignatures.Contests.RecurringContestStarted:
            return parseContestEvent('NewRecurringContestStarted') as {
              event_name: EventNames.ContestStarted;
              event_payload: z.infer<typeof coreEvents.ContestStarted>;
            };
          case EvmEventSignatures.Contests.SingleContestStarted:
            return parseContestEvent('NewSingleContestStarted') as {
              event_name: EventNames.ContestStarted;
              event_payload: z.infer<typeof coreEvents.ContestStarted>;
            };
          case EvmEventSignatures.Contests.ContentAdded:
            return parseContestEvent('ContentAdded') as {
              event_name: EventNames.ContestContentAdded;
              event_payload: z.infer<typeof coreEvents.ContestContentAdded>;
            };
          case EvmEventSignatures.Contests.RecurringContestVoterVoted:
            return parseContestEvent('VoterVotedRecurring') as {
              event_name: EventNames.ContestContentUpvoted;
              event_payload: z.infer<typeof coreEvents.ContestContentUpvoted>;
            };
          case EvmEventSignatures.Contests.SingleContestVoterVoted:
            return parseContestEvent('VoterVotedOneOff') as {
              event_name: EventNames.ContestContentUpvoted;
              event_payload: z.infer<typeof coreEvents.ContestContentUpvoted>;
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

      if (records.length) {
        log.info(
          `>>> ethChainId ${ethChainId}: ${JSON.stringify(
            Object.fromEntries(
              records.reduce(
                (map, { event_name }) =>
                  map.set(event_name, (map.get(event_name) ?? 0) + 1),
                new Map(),
              ),
            ),
          )}`,
        );
        await emitEvent(models.Outbox, records, transaction);
      }
    });
  } catch (e) {
    const msg = `Error occurred while processing ethChainId ${ethChainId}`;
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
  interval: number,
  processFn: (chainNodeId: number, sources: EvmSource) => Promise<void>,
) {
  const evmSources = await getEventSources();

  const numEvmSources = Object.keys(evmSources).length;
  if (!numEvmSources) {
    return;
  }

  const ethChainIds = Object.keys(evmSources);
  const betweenInterval = interval / numEvmSources;

  ethChainIds.forEach((ethChainId, index) => {
    const delay = index * betweenInterval;

    setTimeout(async () => {
      await processFn(+ethChainId, evmSources[ethChainId]);
    }, delay);
  });
}
