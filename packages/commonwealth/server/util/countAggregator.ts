import { cache, CacheNamespaces, logger } from '@hicommonwealth/core';
import { models } from '@hicommonwealth/model';
import { QueryTypes } from 'sequelize';

const log = logger(import.meta);

main().catch((error) => {
  log.fatal('Count aggregator broke', error);
});

export async function main() {
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
  const result = (await cache().scan(namespace, 0, 10000)) as {
    cursor: number;
    keys: string[];
  };

  const namespaceLength = namespace.length;
  const ids = result?.keys?.map((key) => {
    return key.substring(namespaceLength + 1);
  });

  return ids;
}

async function processLifetimeThreadCounts() {
  const communityIds = await getUpdateSignal(
    CacheNamespaces.Community_Thread_Count_Changed,
  );

  if (!communityIds) {
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
}

async function processProfileCounts() {
  const communityIds = await getUpdateSignal(
    CacheNamespaces.Community_Profile_Count_Changed,
  );

  if (!communityIds) {
    return;
  }

  await models.sequelize.query(
    `
        WITH profile_count AS (SELECT community_id, COUNT(*) AS count
            FROM "Users"
            WHERE "community_id" IN (:communityIds)
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
}

async function processReactionCounts() {
  const threadIds = await getUpdateSignal(
    CacheNamespaces.Thread_Reaction_Count_Changed,
  );

  if (!threadIds) {
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
}

// 1. Creates mapping of thread_id -> redis count
// 2. Updates DB
// 3. Clears thread view count namespace
async function processViewCounts() {
  const result = (await cache().scan(
    CacheNamespaces.Thread_View_Count,
    0,
    10000,
  )) as {
    cursor: number;
    keys: string[];
  };
  const ids = result?.keys?.map((key) =>
    parseInt(key.substring(key.indexOf('_') + 1), 10),
  );
  if (!ids) {
    return;
  }
  const values = await cache().getKeys(
    CacheNamespaces.Thread_View_Count,
    result.keys,
  );
  const idToCount = ids
    .map((id, index) => [id, parseInt(values[index]!, 10)])
    .filter(([_, count]) => !isNaN(count));

  for (const key of result.keys) {
    const id = parseInt(key.substring(key.indexOf('_') + 1), 10);
    const count = parseInt(
      (await cache().getKey(CacheNamespaces.Thread_View_Count, key))!,
      10,
    );

    idToCount.push([id, count]);
  }

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
