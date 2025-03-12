import { logger, type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import {
  ClankerToken,
  CommunityIndexer as CommunityIndexerSchema,
  EventPairs,
} from '@hicommonwealth/schemas';
import moment from 'moment';
import { models } from '../database';
import { paginateClankerTokens } from '../policies';
import { emitEvent } from '../utils';

const log = logger(import.meta);

export function IndexCommunities(): Command<typeof schemas.IndexCommunities> {
  return {
    ...schemas.IndexCommunities,
    auth: [],
    body: async () => {
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
            log.warn(
              `${indexer.id} indexer must be backfilled via "pnpm backfill-clanker-tokens"`,
            );
            continue;
          }

          log.debug(`starting community indexer ${indexer.id}`);

          await setIndexerStatus(indexer.id, { status: 'pending' });

          const startedAt = new Date();

          if (indexer.id === 'clanker') {
            const cutoffDate = moment(indexer.last_checked).toDate();

            // Fetch pages descending and add to buffer
            // so they can be inserted in ascending order.
            // Order is important because duplicate token
            // names are enumerated e.g. "Token", "Token (1)",
            // "Token (2)", etc.
            const tokensBuffer: Array<z.infer<typeof ClankerToken>> = [];

            for await (const tokens of paginateClankerTokens({
              cutoffDate,
              desc: true,
            })) {
              tokensBuffer.push(...tokens);
            }

            // Sort from oldest to newest,
            // id reflects clanker's sorting better than created timestamp.
            tokensBuffer.sort(
              (a, b) => moment(a.id!).valueOf() - moment(b.id!).valueOf(),
            );

            const eventsBuffer: Array<EventPairs> = tokensBuffer.map(
              (token) => ({
                event_name: 'ClankerTokenFound',
                event_payload: token,
              }),
            );

            await emitEvent(models.Outbox, eventsBuffer);

            // After all fetching is done, save watermark for next run.
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
  };
}

// ----

type CommunityIndexerStatus = z.infer<typeof CommunityIndexerSchema>['status'];
type CommunityIndexerOptions = {
  status: CommunityIndexerStatus;
  last_checked?: Date;
};

async function setIndexerStatus(
  indexerId: string,
  { status, last_checked: timestamp }: CommunityIndexerOptions,
) {
  const toUpdate: CommunityIndexerOptions = {
    status,
  };
  if (timestamp) {
    toUpdate.last_checked = timestamp;
  }
  await models.CommunityIndexer.update(toUpdate, {
    where: {
      id: indexerId,
    },
  });
}
