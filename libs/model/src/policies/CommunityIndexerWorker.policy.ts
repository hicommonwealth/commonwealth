import { logger, Policy } from '@hicommonwealth/core';
import {
  ClankerToken,
  CommunityIndexer as CommunityIndexerSchema,
  EventNames,
  events,
} from '@hicommonwealth/schemas';
import moment from 'moment';
import { z } from 'zod';
import { models } from '../database';
import { emitEvent } from '../utils';
import {
  createCommunityFromClankerToken,
  paginateClankerTokens,
} from './utils/community-indexer-utils';

const log = logger(import.meta);

const inputs = {
  CommunityIndexerTimerTicked: events.CommunityIndexerTimerTicked,
  ClankerTokenFound: events.ClankerTokenFound,
};

type CommunityIndexerStatus = z.infer<typeof CommunityIndexerSchema>['status'];

async function setIndexerStatus(
  indexerId: string,
  {
    status,
    last_checked: timestamp,
  }: {
    status: CommunityIndexerStatus;
    last_checked?: Date;
  },
) {
  const toUpdate: {
    status: CommunityIndexerStatus;
    last_checked?: Date;
  } = {
    status,
  };
  if (timestamp) {
    toUpdate.last_checked = timestamp;
  }
  return await models.CommunityIndexer.update(toUpdate, {
    where: {
      id: indexerId,
    },
  });
}

export function CommunityIndexerWorker(): Policy<typeof inputs> {
  return {
    inputs,
    body: {
      CommunityIndexerTimerTicked: async () => {
        log.debug(`CommunityIndexerTimerTicked`);
        const indexers = await models.CommunityIndexer.findAll({});

        const pendingIndexers = indexers.filter(
          (idx) => idx.status === 'pending',
        );
        if (pendingIndexers.length > 0) {
          return;
        }

        const idleIndexers = indexers.filter((idx) => idx.status === 'idle');

        for (const indexer of idleIndexers) {
          try {
            if (!indexer.last_checked) {
              log.warn(`${indexer.id} indexer must be backfilled`);
              continue;
            }

            log.debug(`starting community indexer ${indexer.id}`);

            await setIndexerStatus(indexer.id, { status: 'pending' });

            const startedAt = new Date();

            if (indexer.id === 'clanker') {
              // start fetching tokens where indexer last left off
              const oldestIndexedClankerCommunity =
                await models.Community.findOne({
                  where: {
                    indexer: 'clanker',
                  },
                  order: [['token_created_at', 'ASC']],
                });
              const cutoffDate =
                oldestIndexedClankerCommunity!.token_created_at || new Date(0);

              // fetch pages descending and add to buffer
              // so they can be inserted in ascending order
              const tokensBuffer: Array<z.infer<typeof ClankerToken>> = [];

              for await (const tokens of paginateClankerTokens({
                cutoffDate,
                desc: true,
              })) {
                tokensBuffer.push(...tokens);
              }

              tokensBuffer.sort(
                (a, b) =>
                  moment(a.created_at!).valueOf() -
                  moment(b.created_at!).valueOf(),
              );

              const eventsBuffer = tokensBuffer.map((token) => ({
                event_name: EventNames.ClankerTokenFound,
                event_payload: token,
              }));

              await emitEvent(models.Outbox, eventsBuffer);

              // after all fetching is done, save timestamp for next run
              await setIndexerStatus(indexer.id, {
                status: 'idle',
                last_checked: startedAt,
              });
            } else {
              throw new Error(`indexer not implemented: ${indexer.id}`);
            }
          } catch (err) {
            // await setIndexerStatus(indexer.id, { status: 'error' });
            log.error(`failed to index for ${indexer.id}`, err as Error);
            throw err;
          }
        }
      },
      ClankerTokenFound: async ({ payload }) => {
        const existingCommunity = await models.Community.findOne({
          where: {
            token_address: payload.contract_address,
          },
        });
        if (existingCommunity) {
          log.warn(
            `token already has community: ${payload.contract_address}="${existingCommunity.name}"`,
          );
        } else {
          await createCommunityFromClankerToken(payload);
        }
      },
    },
  };
}
