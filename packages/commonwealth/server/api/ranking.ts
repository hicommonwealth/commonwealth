import { RedisCache } from '@hicommonwealth/adapters';
import { cache, CacheNamespaces, logger } from '@hicommonwealth/core';
import { models } from '@hicommonwealth/model';
import { CommunityTierMap, UserTierMap } from '@hicommonwealth/shared';
import { QueryTypes } from 'sequelize';
import { config } from '../config';

const log = logger(import.meta);

// TODO: to round to nearest integer the original float has to be large enough such that
//  the loss of precision is negligible -> set minimum weights i.e. minimum rank

const APPROXIMATE_MAX_SET_SIZE = 500;
const globalThreadRanksKey = 'all';

function safetySetTrim(
  namespace:
    | CacheNamespaces.CommunityThreadRanks
    | CacheNamespaces.GlobalThreadRanks,
  key: string,
  setLength: number,
): Promise<number | undefined> {
  if (setLength > APPROXIMATE_MAX_SET_SIZE + 10) {
    log.error(
      'Redis sorted set size is too large, removing lowest ranking items',
      undefined,
      {
        setLength,
        redis_key: RedisCache.getNamespaceKey(namespace, key),
      },
    );
    return cache().delSortedSetItemsByRank(
      namespace,
      key,
      0,
      setLength - APPROXIMATE_MAX_SET_SIZE,
    );
  }
  return Promise.resolve(undefined);
}

function addOrUpdateSortedSetRank(
  namespace:
    | CacheNamespaces.CommunityThreadRanks
    | CacheNamespaces.GlobalThreadRanks,
  key: string,
  setLength: number,
  rank: number,
  threadId: number,
  lowestRankedItem:
    | {
        value: string;
        score: number;
      }
    | undefined,
): (
  | Promise<number>
  | Promise<{ score: number; value: string }[]>
  | Promise<undefined>
)[] {
  if (setLength < APPROXIMATE_MAX_SET_SIZE) {
    return [
      cache().addToSortedSet(namespace, key, {
        value: threadId.toString(),
        score: rank,
      }),
    ];
  } else if (lowestRankedItem && lowestRankedItem.score < rank) {
    return [
      cache().addToSortedSet(namespace, key, {
        value: threadId.toString(),
        score: rank,
      }),
      cache().sortedSetPopMin(namespace, key),
    ];
  }
  return [Promise.resolve(undefined)];
}

/**
 * Increments the rank of threads in community sorted sets as well as in the
 * global sorted set only if the new rank is higher than the lowest rank in
 * the set.
 */
async function incrementCachedRank(
  communityId: string,
  threadId: number,
  communityRank: number,
  globalRank: number,
) {
  // get the lowest score item + number of elements in the set
  const [
    lowestCommunityItem,
    communitySetLength,
    lowestGlobalItem,
    globalSetLength,
  ] = await Promise.all([
    cache().sliceSortedSetWithScores(
      CacheNamespaces.CommunityThreadRanks,
      communityId,
    ),
    cache().getSortedSetSize(CacheNamespaces.CommunityThreadRanks, communityId),
    cache().sliceSortedSetWithScores(
      CacheNamespaces.GlobalThreadRanks,
      globalThreadRanksKey,
    ),
    cache().getSortedSetSize(
      CacheNamespaces.GlobalThreadRanks,
      globalThreadRanksKey,
    ),
  ]);

  // theoretically won't happen but added in-case to prevent Redis set infinitely growing
  await Promise.allSettled([
    safetySetTrim(
      CacheNamespaces.CommunityThreadRanks,
      communityId,
      communitySetLength,
    ),
    safetySetTrim(
      CacheNamespaces.GlobalThreadRanks,
      globalThreadRanksKey,
      globalSetLength,
    ),
  ]);

  await Promise.allSettled([
    ...addOrUpdateSortedSetRank(
      CacheNamespaces.CommunityThreadRanks,
      communityId,
      communitySetLength,
      communityRank,
      threadId,
      lowestCommunityItem[0],
    ),
    ...addOrUpdateSortedSetRank(
      CacheNamespaces.GlobalThreadRanks,
      globalThreadRanksKey,
      globalSetLength,
      globalRank,
      threadId,
      lowestGlobalItem[0],
    ),
  ]);
}

/**
 * Increments the rank of a batch of threads from multiple communities. This is
 * primarily used for ViewCount related rank updates.
 */
export async function batchedIncrementCachedRank(
  data: {
    community_id: string;
    ranks: { thread_id: number; community_rank: string; global_rank: string }[];
  }[],
) {
  const [globalLowestRankedItem, globalSetLength] = await Promise.all([
    cache().sliceSortedSetWithScores(
      CacheNamespaces.GlobalThreadRanks,
      globalThreadRanksKey,
    ),
    cache().getSortedSetSize(
      CacheNamespaces.GlobalThreadRanks,
      globalThreadRanksKey,
    ),
  ]);
  const globalNumAddedPromises: Promise<number | undefined>[] = [];

  const communityData: Record<
    string,
    { setLength: number; promiseIndex: number }
  > = {};
  const communityNumAddedPromises: Promise<number | undefined>[] = [];
  let index = 0;
  for (const { community_id, ranks } of data) {
    const globalRanksToAdd = ranks.filter(
      ({ global_rank }) =>
        parseInt(global_rank) > (globalLowestRankedItem[0]?.score || 0),
    );
    if (globalRanksToAdd.length > 0) {
      globalNumAddedPromises.push(
        cache().addToSortedSet(
          CacheNamespaces.GlobalThreadRanks,
          globalThreadRanksKey,
          globalRanksToAdd.map(({ thread_id, global_rank }) => ({
            score: parseInt(global_rank),
            value: thread_id.toString(),
          })),
        ),
      );
    }

    let lowestRankedItem: { value: string; score: number }[];
    let setLength: number;
    try {
      // get the lowest score item + number of elements in the set
      [lowestRankedItem, setLength] = await Promise.all([
        cache().sliceSortedSetWithScores(
          CacheNamespaces.CommunityThreadRanks,
          community_id,
        ),
        cache().getSortedSetSize(
          CacheNamespaces.CommunityThreadRanks,
          community_id,
        ),
      ]);
    } catch (e) {
      log.error(
        'Failed to get lowest ranked item and set length from community sorted set (batched)',
        undefined,
        {
          key: RedisCache.getNamespaceKey(
            CacheNamespaces.CommunityThreadRanks,
            community_id,
          ),
        },
      );
      continue;
    }

    const communityRanksToAdd = ranks.filter(
      ({ community_rank }) =>
        parseInt(community_rank) > (lowestRankedItem[0]?.score || 0),
    );
    if (communityRanksToAdd.length > 0) {
      communityNumAddedPromises.push(
        cache().addToSortedSet(
          CacheNamespaces.CommunityThreadRanks,
          community_id,
          communityRanksToAdd.map(({ thread_id, community_rank }) => ({
            score: parseInt(community_rank),
            value: thread_id.toString(),
          })),
        ),
      );
      communityData[community_id] = {
        setLength,
        promiseIndex: index,
      };
      index++;
    }
  }

  const numAddedRes = await Promise.allSettled(communityNumAddedPromises);
  const popPromises: Promise<{ value: string; score: number }[]>[] = [];

  for (const [community_id, { setLength, promiseIndex }] of Object.entries(
    communityData,
  )) {
    const communityKey = `${CacheNamespaces.CommunityThreadRanks}_${community_id}`;

    const numAdded = numAddedRes[promiseIndex];
    if (numAdded.status === 'rejected') {
      log.error(
        'Failed to add batched rank to community sorted set',
        undefined,
        {
          key: communityKey,
          reason: numAdded.reason,
        },
      );
      continue;
    }

    if (
      numAdded.value &&
      setLength + numAdded.value > APPROXIMATE_MAX_SET_SIZE
    ) {
      popPromises.push(
        cache().sortedSetPopMin(
          CacheNamespaces.CommunityThreadRanks,
          community_id,
          setLength + numAdded.value - APPROXIMATE_MAX_SET_SIZE,
        ),
      );
    }
  }

  await Promise.allSettled(popPromises);

  const globalPromiseRes = await Promise.allSettled(globalNumAddedPromises);
  let globalNumAdded = 0;
  for (const promise of globalPromiseRes) {
    if (promise.status === 'rejected') {
      log.error('Failed to add batched rank to global sorted set', undefined, {
        key: globalThreadRanksKey,
        reason: promise.reason,
      });
      continue;
    }
    globalNumAdded += promise.value || 0;
  }
  if (globalSetLength + globalNumAdded > APPROXIMATE_MAX_SET_SIZE) {
    await cache().sortedSetPopMin(
      CacheNamespaces.GlobalThreadRanks,
      globalThreadRanksKey,
      globalSetLength + globalNumAdded - APPROXIMATE_MAX_SET_SIZE,
    );
  }
}

/**
 * Decrements the rank of a thread in the relevant community sorted set and the
 * global sorted set.
 */
async function decrementCachedRank(
  communityId: string,
  threadId: number,
  communityRank: number,
  globalRank: number,
) {
  // update the score if it exists (and do nothing if it doesn't)
  await Promise.allSettled([
    cache().addToSortedSet(
      CacheNamespaces.CommunityThreadRanks,
      communityId,
      {
        score: communityRank,
        value: threadId.toString(),
      },
      { updateOnly: true },
    ),
    cache().addToSortedSet(
      CacheNamespaces.GlobalThreadRanks,
      globalThreadRanksKey,
      {
        score: globalRank,
        value: threadId.toString(),
      },
      { updateOnly: true },
    ),
  ]);
}

async function deleteCachedRank(communityId: string, threadId: number) {
  await Promise.allSettled([
    cache().delSortedSetItemsByValue(
      CacheNamespaces.CommunityThreadRanks,
      communityId,
      threadId.toString(),
    ),
    cache().delSortedSetItemsByValue(
      CacheNamespaces.GlobalThreadRanks,
      globalThreadRanksKey,
      threadId.toString(),
    ),
  ]);
}

async function updatePostgresRank(threadId: number, rankIncrease: number) {
  const rank = (await models.sequelize.query(
    `
      UPDATE "ThreadRanks"
      SET community_rank = community_rank + :rankIncrease,
          global_rank    = global_rank + :rankIncrease,
          updated_at     = NOW()
      WHERE thread_id = :threadId
      RETURNING community_rank, global_rank;
    `,
    {
      type: QueryTypes.UPDATE,
      replacements: { rankIncrease: Math.round(rankIncrease), threadId },
    },
  )) as unknown as [{ community_rank: string; global_rank: string }[], number];
  return rank[0];
}

export async function createThreadRank(
  thread: {
    id: number;
    created_at: Date;
    user_tier_at_creation: UserTierMap;
  },
  community: { id: string; tier: CommunityTierMap },
) {
  const communityRank =
    Math.floor((thread.created_at?.getTime() || Date.now()) / 1000) *
      config.HEURISTIC_WEIGHTS.CREATED_DATE_WEIGHT +
    thread.user_tier_at_creation *
      config.HEURISTIC_WEIGHTS.CREATOR_USER_TIER_WEIGHT;
  const globalRank =
    Math.round(communityRank) +
    config.HEURISTIC_WEIGHTS.COMMUNITY_TIER_WEIGHT * community.tier;

  await models.ThreadRank.create({
    thread_id: thread.id!,
    community_rank: BigInt(Math.round(communityRank)),
    global_rank: BigInt(globalRank),
  });
  await incrementCachedRank(
    community.id,
    thread.id!,
    communityRank,
    globalRank,
  );
}

/**
 * Removes a thread from all sorted sets when it becomes ineligible for ranking.
 * Ineligibility includes but is not limited to deleting a thread or marking a
 * thread as spam.
 */
export async function updateRankOnThreadIneligibility({
  thread_id,
  community_id,
}: {
  thread_id: number;
  community_id: string;
}) {
  await models.ThreadRank.destroy({
    where: { thread_id },
  });
  await deleteCachedRank(community_id, thread_id);
}

type ThreadRankUpdateParams = {
  thread_id: number;
  community_id: string;
  user_tier_at_creation: number;
};

export async function incrementThreadRank(
  updateWeight: number,
  { community_id, thread_id, user_tier_at_creation }: ThreadRankUpdateParams,
) {
  const rankIncrease = user_tier_at_creation * updateWeight;
  const rank = await updatePostgresRank(thread_id, rankIncrease);
  if (rank.length === 0) {
    log.trace(`No thread rank found for thread ${thread_id}`);
    return;
  }
  await incrementCachedRank(
    community_id!,
    thread_id!,
    Number(rank[0].community_rank),
    Number(rank[0].global_rank),
  );
}

export async function decrementThreadRank(
  weight: number,
  { community_id, thread_id, user_tier_at_creation }: ThreadRankUpdateParams,
) {
  const rankDecrease = user_tier_at_creation * weight;
  const rank = await updatePostgresRank(thread_id, -rankDecrease);
  if (rank.length === 0) {
    log.trace(`No thread rank found for thread ${thread_id}`);
    return;
  }
  // It is possible for a set to contain ranks which are lower than the top ranks in Postgres
  // since we don't replace a decreased rank with the next highest rank from Postgres. This is because:
  // 1. We avoid an index on rank in "ThreadsRank" table
  // 2. Comment deletion/spam is rare
  await decrementCachedRank(
    community_id!,
    thread_id!,
    Number(rank[0].community_rank),
    Number(rank[0].global_rank),
  );
}
