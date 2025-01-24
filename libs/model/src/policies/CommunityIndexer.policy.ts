import { logger, Policy } from '@hicommonwealth/core';
import {
  CommunityIndexer as CommunityIndexerSchema,
  EventNames,
  EventPairs,
  events,
} from '@hicommonwealth/schemas';
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

export function CommunityIndexer(): Policy<typeof inputs> {
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
            log.debug(`starting community indexer ${indexer.id}`);

            if (!indexer.last_checked) {
              throw new Error(`${indexer.id} indexer must be backfilled`);
            }

            await setIndexerStatus(indexer.id, { status: 'pending' });

            const startedAt = new Date();

            if (indexer.id === 'clanker') {
              // start fetching tokens where indexer last left off
              for await (const tokens of paginateClankerTokens(
                indexer.last_checked,
              )) {
                const eventsToEmit: Array<EventPairs> = tokens.map((token) => ({
                  event_name: EventNames.ClankerTokenFound,
                  event_payload: token,
                }));
                await emitEvent(models.Outbox, eventsToEmit);
              }

              // after all fetching is done, save timestamp for next run
              await setIndexerStatus(indexer.id, {
                status: 'idle',
                last_checked: startedAt,
              });
            } else {
              throw new Error(`indexer not implemented: ${indexer.id}`);
            }
          } catch (err) {
            await setIndexerStatus(indexer.id, { status: 'error' });
            log.error(`failed to index for ${indexer.id}`, err as Error);
            throw err;
          }
        }
      },
      ClankerTokenFound: async ({ payload }) => {
        await createCommunityFromClankerToken(payload);
      },
    },
  };
}
