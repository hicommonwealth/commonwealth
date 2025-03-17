import { RedisCache } from '@hicommonwealth/adapters';
import { cache, CacheNamespaces, dispose, logger } from '@hicommonwealth/core';
import { GraphileTask, models, TaskPayloads } from '@hicommonwealth/model';
import { QueryTypes } from 'sequelize';
import { config } from '../../../config';

const log = logger(import.meta);

export const countAggregatorTask: GraphileTask<
  typeof TaskPayloads.CountAggregator
> = {
  input: TaskPayloads.CountAggregator,
  fn: countAggregator,
};

if (import.meta.url.endsWith(process.argv[1])) {
  config.CACHE.REDIS_URL &&
    config.NODE_ENV !== 'test' &&
    cache({
      adapter: new RedisCache(config.CACHE.REDIS_URL),
    });

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

async function getUpdateSignal(namespace: CacheNamespaces) {
  let cursor = 0;
  const allKeys: string[] = [];
  const namespaceLength = namespace.length;

  do {
    const result = (await cache().scan(namespace, cursor, 10000)) as {
      cursor: number;
      keys: string[];
    };

    if (!result) {
      return;
    }

    cursor = result.cursor;
    allKeys.push(...result.keys);
  } while (cursor !== 0);

  const ids = allKeys.map((key) => key.substring(namespaceLength + 1));

  return ids;
}

async function processLifetimeThreadCounts() {
  const communityIds = await getUpdateSignal(
    CacheNamespaces.Community_Thread_Count_Changed,
  );

  if (!communityIds?.length) {
    return;
  }

  await models.sequelize.query(
    `
        WITH lifetime_thread_count AS (SELECT community_id, COUNT(*) AS count
            FROM "Threads"
            WHERE "community_id" IN (:communityIds)
            GROUP BY "community_id"
        )
        UPDATE "Communities"
        SET lifetime_thread_count = lifetime_thread_count.count FROM lifetime_thread_count
        WHERE "Communities".id = lifetime_thread_count.community_id;
    `,
    {
      replacements: { communityIds },
      type: QueryTypes.UPDATE,
    },
  );

  await cache().deleteNamespaceKeys(
    CacheNamespaces.Community_Thread_Count_Changed,
  );
}

async function processProfileCounts() {
  const communityIds = await getUpdateSignal(
    CacheNamespaces.Community_Profile_Count_Changed,
  );

  if (!communityIds?.length) {
    return;
  }

  await models.sequelize.query(
    `
        WITH profile_count AS (SELECT community_id, COUNT(*) AS count
            FROM "Addresses" A
            WHERE A.community_id = C.id AND A.user_id IS NOT NULL AND A.verified IS NOT NULL
            GROUP BY "community_id"
        )
        UPDATE "Communities"
        SET profile_count = profile_count.count FROM profile_count
        WHERE "Communities".id = profile_count.community_id;
    `,
    {
      replacements: { communityIds },
      type: QueryTypes.UPDATE,
    },
  );

  await cache().deleteNamespaceKeys(
    CacheNamespaces.Community_Profile_Count_Changed,
  );
}

async function processReactionCounts() {
  const threadIds = await getUpdateSignal(
    CacheNamespaces.Thread_Reaction_Count_Changed,
  );

  if (!threadIds?.length) {
    return;
  }

  await models.sequelize.query(
    `
        WITH reaction_count AS (SELECT thread_id, COUNT(*) AS count
            FROM "Reactions"
            WHERE "thread_id" IN (:threadIds)
            GROUP BY "thread_id"
        )
        UPDATE "Threads"
        SET reaction_count = reaction_count.count FROM reaction_count
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

// 1. Creates mapping of thread_id -> redis count
// 2. Updates DB
// 3. Clears thread view count namespace
async function processViewCounts() {
  let cursor = 0;
  const allKeys: string[] = [];

  do {
    const result = (await cache().scan(
      CacheNamespaces.Thread_View_Count,
      cursor,
      10000,
    )) as {
      cursor: number;
      keys: string[];
    };

    if (!result) {
      return;
    }

    cursor = result.cursor;
    allKeys.push(...result.keys);
  } while (cursor !== 0);

  const namespaceLength = CacheNamespaces.Thread_View_Count.length;
  const ids = allKeys?.map((key) => {
    return key.substring(namespaceLength + 1);
  });
  if (!ids?.length) {
    return;
  }

  const values = await cache().getKeys(CacheNamespaces.Thread_View_Count, ids);
  const idToCount = Object.entries(values).map(([key, value]) => [
    key.substring(namespaceLength + 1),
    parseInt(value, 10),
  ]);

  // convert idToCount into a bulk update sql statement
  if (idToCount.length > 0) {
    const cases = idToCount
      .map(([threadId, count]) => `WHEN ${threadId} THEN view_count + ${count}`)
      .join(' ');

    const threadIds = idToCount.map(([threadId]) => threadId).join(', ');

    const query = `
        UPDATE "Threads"
        SET view_count = CASE id
          ${cases}
        END
        WHERE id IN (${threadIds});
      `;

    await models.sequelize.query(query);

    await cache().deleteNamespaceKeys(CacheNamespaces.Thread_View_Count);
  }
}
