import { RedisCache } from '@hicommonwealth/adapters';
import { CacheNamespaces, logger } from '@hicommonwealth/core';
import { models } from '@hicommonwealth/model';
import { Comment, Thread } from '@hicommonwealth/schemas';
import { QueryTypes } from 'sequelize';
import { z } from 'zod';
import { config } from '../config';

const log = logger(import.meta);

const redis = new RedisCache(config.CACHE.REDIS_URL!);
const client = redis.client;

// TODO: to round to nearest integer the original float has to be large enough such that
//  the loss of precision is negligible -> set minimum weights i.e. minimum rank

function toBigInt(value: number) {
  return BigInt(Math.round(value));
}

const APPROXIMATE_MAX_SET_SIZE = 500;

async function incrementCachedRank(
  communityId: string,
  threadId: number,
  rank: number,
) {
  const strThreadId = threadId.toString();
  const communityKey = `${CacheNamespaces.CommunityThreadRanks}_${communityId}`;

  // get the lowest score item + number of elements in the set
  const [lowestScoreItem, setLength] = await Promise.all([
    client.zRangeWithScores(communityKey, 0, 0),
    client.zCard(communityKey),
  ]);

  // theoretically won't happen but added in-case to prevent Redis set infinitely growing
  if (setLength > APPROXIMATE_MAX_SET_SIZE + 10) {
    // logging as error so it is reported to Rollbar and we get a notification
    log.error('Redis set size is too large, removing oldest items');
    await client.zRemRangeByRank(
      communityKey,
      0,
      setLength - APPROXIMATE_MAX_SET_SIZE,
    );
  }

  if (setLength < APPROXIMATE_MAX_SET_SIZE) {
    await client.zAdd(communityKey, { score: rank, value: strThreadId });
  } else if (lowestScoreItem[0].score < rank) {
    await Promise.all([
      client.zAdd(communityKey, { score: rank, value: strThreadId }),
      client.zPopMinCount(communityKey, 1),
    ]);
  }
}

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
    SET rank = rank + :rankIncrease
    WHERE thread_id = :threadId
    RETURNING rank;
  `,
    {
      type: QueryTypes.UPDATE,
      replacements: { rankIncrease: toBigInt(rankIncrease), threadId },
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
    rank: toBigInt(rank),
  });
  await incrementCachedRank(thread.community_id!, thread.id!, rank);
}

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

export async function updateThreadRankOnComment(
  comment: z.infer<typeof Comment> & { community_id: string },
) {
  const rankIncrease =
    (comment.user_tier_at_creation || 1) *
    config.HEURISTIC_WEIGHTS.COMMENT_WEIGHT;

  const rank = await updatePostgresRank(comment.thread_id, rankIncrease);

  if (rank.length === 0) {
    log.trace(`No thread rank found for thread ${comment.thread_id}`);
    return;
  }

  await incrementCachedRank(
    comment.community_id!,
    comment.thread_id!,
    Number(rank[0].rank),
  );
}

export async function updateThreadRankOnCommentIneligibility(comment: {
  community_id: string;
  thread_id: number;
  user_tier_at_creation?: number | null;
}) {
  const rankDecrease =
    (comment.user_tier_at_creation || 1) *
    config.HEURISTIC_WEIGHTS.COMMENT_WEIGHT;

  const rank = await updatePostgresRank(comment.thread_id, -rankDecrease);

  if (rank.length === 0) {
    log.trace(`No thread rank found for thread ${comment.thread_id}`);
    return;
  }

  // It is possible for a set to contain ranks which are lower than the top ranks in Postgres
  // since we don't replace a decreased rank with the next highest rank from Postgres. This is because:
  // 1. We avoid an index on rank in "ThreadsRank" table
  // 2. Comment deletion/spam is rare
  await decrementCachedRank(
    comment.community_id!,
    comment.thread_id!,
    Number(rank[0].rank),
  );
}
