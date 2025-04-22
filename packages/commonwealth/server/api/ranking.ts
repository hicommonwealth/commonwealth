import { RedisCache } from '@hicommonwealth/adapters';
import { CacheNamespaces, logger } from '@hicommonwealth/core';
import { models } from '@hicommonwealth/model';
import { Thread } from '@hicommonwealth/schemas';
import { QueryTypes } from 'sequelize';
import { z } from 'zod';
import { config } from '../config';

const log = logger(import.meta);

const redis = new RedisCache(config.CACHE.REDIS_URL!);
const client = redis.client;

// TODO: to round to nearest integer the original float has to be large enough such that
//  the loss of precision is negligible -> set minimum weights i.e. minimum rank

const APPROXIMATE_MAX_SET_SIZE = 500;
const globalThreadRanksKey = 'global_thread_ranks';

function safetySetTrim(
  key: string,
  setLength: number,
): Promise<number | undefined> {
  if (setLength > APPROXIMATE_MAX_SET_SIZE + 10) {
    log.error(
      'Redis sorted set size is too large, removing lowest ranking items',
      undefined,
      {
        setLength,
        redis_key: key,
      },
    );
    return client.zRemRangeByRank(key, 0, setLength - APPROXIMATE_MAX_SET_SIZE);
  }
  return Promise.resolve(undefined);
}

function addOrUpdateSortedSetRank(
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
    return [client.zAdd(key, { score: rank, value: threadId.toString() })];
  } else if (lowestRankedItem && lowestRankedItem.score < rank) {
    return [
      client.zAdd(key, { score: rank, value: threadId.toString() }),
      client.zPopMinCount(key, 1),
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
  rank: number,
) {
  const communityKey = `${CacheNamespaces.CommunityThreadRanks}_${communityId}`;

  // get the lowest score item + number of elements in the set
  const [
    lowestCommunityItem,
    communitySetLength,
    lowestGlobalItem,
    globalSetLength,
  ] = await Promise.all([
    client.zRangeWithScores(communityKey, 0, 0),
    client.zCard(communityKey),
    client.zRangeWithScores(globalThreadRanksKey, 0, 0),
    client.zCard(globalThreadRanksKey),
  ]);

  // theoretically won't happen but added in-case to prevent Redis set infinitely growing
  await Promise.allSettled([
    safetySetTrim(communityKey, communitySetLength),
    safetySetTrim(globalThreadRanksKey, globalSetLength),
  ]);

  await Promise.allSettled([
    ...addOrUpdateSortedSetRank(
      communityKey,
      communitySetLength,
      rank,
      threadId,
      lowestCommunityItem[0],
    ),
    ...addOrUpdateSortedSetRank(
      globalThreadRanksKey,
      globalSetLength,
      rank,
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
    ranks: { thread_id: number; rank: string }[];
  }[],
) {
  const [globalLowestRankedItem, globalSetLength] = await Promise.all([
    client.zRangeWithScores(globalThreadRanksKey, 0, 0),
    client.zCard(globalThreadRanksKey),
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
      ({ rank }) => parseInt(rank) > (globalLowestRankedItem[0]?.score || 0),
    );
    if (globalRanksToAdd.length > 0) {
      globalNumAddedPromises.push(
        client.zAdd(
          globalThreadRanksKey,
          globalRanksToAdd.map(({ thread_id, rank }) => ({
            score: parseInt(rank),
            value: thread_id.toString(),
          })),
        ),
      );
    }

    const communityKey = `${CacheNamespaces.CommunityThreadRanks}_${community_id}`;
    let lowestRankedItem: { value: string; score: number }[];
    let setLength: number;
    try {
      // get the lowest score item + number of elements in the set
      [lowestRankedItem, setLength] = await Promise.all([
        client.zRangeWithScores(communityKey, 0, 0),
        client.zCard(communityKey),
      ]);
    } catch (e) {
      log.error(
        'Failed to get lowest ranked item and set length from community sorted set (batched)',
        undefined,
        {
          communityKey,
        },
      );
      continue;
    }

    const communityRanksToAdd = ranks.filter(
      ({ rank }) => parseInt(rank) > (lowestRankedItem[0]?.score || 0),
    );
    if (communityRanksToAdd.length > 0) {
      communityNumAddedPromises.push(
        client.zAdd(
          communityKey,
          communityRanksToAdd.map(({ thread_id, rank }) => ({
            score: parseInt(rank),
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
        client.zPopMinCount(
          communityKey,
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
    await client.zPopMinCount(
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
  rank: number,
) {
  const strThreadId = threadId.toString();
  const communityKey = `${CacheNamespaces.CommunityThreadRanks}_${communityId}`;

  // update the score if it exists (and do nothing if it doesn't)
  await client.zAdd(
    communityKey,
    { score: rank, value: strThreadId },
    { XX: true },
  );
}

async function deleteCachedRank(communityId: string, threadId: number) {
  const communityKey = `${CacheNamespaces.CommunityThreadRanks}_${communityId}`;
  await client.zRem(communityKey, threadId.toString());
}

async function updatePostgresRank(threadId: number, rankIncrease: number) {
  const rank = (await models.sequelize.query(
    `
      UPDATE "ThreadRanks"
      SET rank       = rank + :rankIncrease,
          updated_at = NOW()
      WHERE thread_id = :threadId
      RETURNING rank;
    `,
    {
      type: QueryTypes.UPDATE,
      replacements: { rankIncrease: Math.round(rankIncrease), threadId },
    },
  )) as unknown as [{ rank: number }[], number];
  return rank[0];
}

export async function createThreadRank(thread: z.infer<typeof Thread>) {
  const rank =
    Math.floor((thread.created_at?.getTime() || Date.now()) / 1000) *
      config.HEURISTIC_WEIGHTS.CREATED_DATE_WEIGHT +
    (thread.user_tier_at_creation || 1) *
      config.HEURISTIC_WEIGHTS.CREATOR_USER_TIER_WEIGHT;
  await models.ThreadRank.create({
    thread_id: thread.id!,
    rank: BigInt(Math.round(rank)),
  });
  await incrementCachedRank(thread.community_id!, thread.id!, rank);
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
  await incrementCachedRank(community_id!, thread_id!, Number(rank[0].rank));
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
  await decrementCachedRank(community_id!, thread_id!, Number(rank[0].rank));
}
