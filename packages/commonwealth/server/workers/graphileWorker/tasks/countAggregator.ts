import { cache, CacheNamespaces, dispose, logger } from '@hicommonwealth/core';
import {
  GraphileTask,
  pgMultiRowUpdate,
  TaskPayloads,
} from '@hicommonwealth/model';
import { models } from '@hicommonwealth/model/db';
import { CountAggregatorKeys } from '@hicommonwealth/shared';
import { QueryTypes } from 'sequelize';
import { batchedIncrementCachedRank } from '../../../api/ranking';
import { config } from '../../../config';

const log = logger(import.meta);

export const countAggregatorTask: GraphileTask<
  typeof TaskPayloads.CountAggregator
> = {
  input: TaskPayloads.CountAggregator,
  fn: countAggregator,
};

if (import.meta.url.endsWith(process.argv[1])) {
  countAggregator()
    .then(() => {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      dispose()('EXIT', true);
    })
    .catch((err) => {
      log.error('Failed to delete user', err);
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      dispose()('ERROR', true);
    });
}

export async function countAggregator() {
  await cache().ready();

  try {
    await processViewCounts();
  } catch (error) {
    log.error('Process View counts failed:', error);
  }

  try {
    await processLifetimeThreadCounts();
  } catch (error) {
    log.error('Process Lifetime Thread counts failed:', error);
  }

  try {
    await processProfileCounts();
  } catch (error) {
    log.error('Process Profile counts failed:', error);
  }

  try {
    await processReactionCounts();
  } catch (error) {
    log.error('Process Reaction counts failed:', error);
  }
}

async function processLifetimeThreadCounts() {
  const communityIds = await cache().getSet(
    CacheNamespaces.CountAggregator,
    CountAggregatorKeys.CommunityThreadCount,
  );

  if (!communityIds.length) {
    return;
  }

  await models.sequelize.query(
    `
      WITH lifetime_thread_count AS (SELECT community_id, COUNT(*) AS count
                                     FROM "Threads"
                                     WHERE "community_id" IN (:communityIds)
                                     GROUP BY "community_id")
      UPDATE "Communities"
      SET lifetime_thread_count = lifetime_thread_count.count
      FROM lifetime_thread_count
      WHERE "Communities".id = lifetime_thread_count.community_id;
    `,
    {
      replacements: { communityIds },
      type: QueryTypes.UPDATE,
    },
  );

  await cache().deleteKey(
    CacheNamespaces.CountAggregator,
    CountAggregatorKeys.CommunityThreadCount,
  );
}

async function processProfileCounts() {
  const communityIds = await cache().getSet(
    CacheNamespaces.CountAggregator,
    CountAggregatorKeys.CommunityProfileCount,
  );

  if (!communityIds?.length) {
    return;
  }

  await models.sequelize.query(
    `
      UPDATE "Communities" C
      SET profile_count = sub.count
      FROM (SELECT community_id, COUNT(*) AS count
            FROM "Addresses"
            WHERE user_id IS NOT NULL
              AND verified IS NOT NULL
            GROUP BY community_id) AS sub
      WHERE C.id = sub.community_id
        AND C.id IN (:communityIds);
    `,
    {
      replacements: { communityIds },
      type: QueryTypes.UPDATE,
    },
  );

  await cache().deleteKey(
    CacheNamespaces.CountAggregator,
    CountAggregatorKeys.CommunityProfileCount,
  );
}

async function processReactionCounts() {
  const threadIds = await cache().getSet(
    CacheNamespaces.CountAggregator,
    'thread_reaction_count_changed',
  );

  if (!threadIds?.length) {
    return;
  }

  await models.sequelize.query(
    `
      WITH reaction_count AS (SELECT thread_id, COUNT(*) AS count
                              FROM "Reactions"
                              WHERE "thread_id" IN (:threadIds)
                              GROUP BY "thread_id")
      UPDATE "Threads"
      SET reaction_count = reaction_count.count
      FROM reaction_count
      WHERE "Threads".id = reaction_count.thread_id;
    `,
    {
      replacements: { communityIds: threadIds },
      type: QueryTypes.UPDATE,
    },
  );

  await cache().deleteNamespaceKeys(
    CacheNamespaces.Thread_Reaction_Count_Changed,
  );
}

async function processViewCounts() {
  const threadIdHash = await cache().getHash(
    CacheNamespaces.CountAggregator,
    CountAggregatorKeys.ThreadViewCount,
  );

  if (!Object.keys(threadIdHash).length) return;

  const communityRankUpdates: { newValue: string; whenCaseValue: number }[] =
    [];
  const globalRankUpdates: { newValue: string; whenCaseValue: number }[] = [];
  const viewCountUpdates: { newValue: string; whenCaseValue: number }[] = [];

  for (const [threadId, count] of <[string, string][]>(
    Object.entries(threadIdHash)
  )) {
    const threadRankIncrease = Math.round(
      config.HEURISTIC_WEIGHTS.VIEW_COUNT_WEIGHT * parseInt(count),
    );
    if (threadRankIncrease > 0) {
      communityRankUpdates.push({
        newValue: `community_rank + ${threadRankIncrease}`,
        whenCaseValue: Number(threadId),
      });
      globalRankUpdates.push({
        newValue: `global_rank + ${threadRankIncrease}`,
        whenCaseValue: Number(threadId),
      });
    }
    viewCountUpdates.push({
      newValue: `view_count + ${count}`,
      whenCaseValue: Number(threadId),
    });
  }

  // Not in a txn to avoid locking many threads during rank updates
  // Neither of these updates are critical and occasional data loss is tolerable
  await pgMultiRowUpdate(
    'Threads',
    [
      {
        setColumn: 'view_count',
        rows: viewCountUpdates,
      },
    ],
    'id',
  );
  await pgMultiRowUpdate(
    'ThreadRanks',
    [
      {
        setColumn: 'community_rank',
        rows: communityRankUpdates,
      },
      {
        setColumn: 'global_rank',
        rows: globalRankUpdates,
      },
    ],
    'thread_id',
    undefined,
    true,
  );
  await cache().deleteKey(
    CacheNamespaces.CountAggregator,
    CountAggregatorKeys.ThreadViewCount,
  );

  const ranks = await models.sequelize.query<{
    community_id: string;
    ranks: { thread_id: number; community_rank: string; global_rank: string }[];
  }>(
    `
      SELECT T.community_id, ARRAY_AGG(ROW_TO_JSON(TR)) AS ranks
      FROM "ThreadRanks" TR
             JOIN "Threads" T ON TR.thread_id = T.id
      WHERE TR.thread_id IN (:threadIds)
      GROUP BY T.community_id;
    `,
    {
      replacements: { threadIds: Object.keys(threadIdHash) },
      type: QueryTypes.SELECT,
    },
  );
  await batchedIncrementCachedRank(ranks);
}
