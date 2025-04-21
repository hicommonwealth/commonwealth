import { cache, CacheNamespaces, dispose, logger } from '@hicommonwealth/core';
import { GraphileTask, models, TaskPayloads } from '@hicommonwealth/model';
import { QueryTypes } from 'sequelize';

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

// 1. Creates mapping of thread_id -> redis count
// 2. Updates DB
// 3. Clears thread view count namespace
async function processViewCounts() {
  const threadIdHash = await cache().getHash(
    CacheNamespaces.CountAggregator,
    'thread_view_counts',
  );
  const threadIds = Object.keys(threadIdHash).join(', ');

  if (threadIds.length > 0) {
    const cases = Object.entries(threadIdHash)
      .map(([threadId, count]) => `WHEN ${threadId} THEN ${count}`)
      .join(' ');
    const query = `
        UPDATE "Threads"
        SET view_count = CASE id
          ${cases}
        END
        WHERE id IN (${threadIds});
      `;
    await models.sequelize.query(query);
    await cache().deleteKey(
      CacheNamespaces.CountAggregator,
      'thread_view_counts',
    );
  }
}
