import * as schemas from '@hicommonwealth/schemas';
import { CommunityTierMap } from '@hicommonwealth/shared';
import { QueryTypes } from 'sequelize';
import { z } from 'zod';
import { models } from '../database';
import { filterPrivateTopics, joinPrivateTopics } from './privateTopics';

/**
 * Gets last updated threads and their recent comments
 * @param user_id by user id communities, 0 for global
 * @param limit thread limit
 * @param comment_limit comment limit
 */

type GetUserActivityFeedParams = z.infer<typeof schemas.ActivityFeed.input> & {
  user_id?: number;
};

export const baseActivityQuery = `
  SELECT
    T.community_id,
    T.icon_url as community_icon,
    T.id,
    T.address_id,
    json_build_object(
        'id', A.id,
        'address', A.address,
        'community_id', A.community_id
    ) as "Address",
    U.id as user_id,
    U.tier as user_tier,
    A.last_active as address_last_active,
    U.profile->>'avatar_url' as avatar_url,
    U.profile->>'name' as profile_name,
    T.body,
    T.content_url,
    T.title,
    T.kind,
    T.stage,
    T.comment_count,
    T.created_at::text,
    T.updated_at::text,
    T.deleted_at::text,
    T.locked_at::text,
    T.archived_at::text,
    T.marked_as_spam_at::text,
    T.read_only,
    T.has_poll,
    T.discord_meta,
    T.is_linking_token,
    T.topic_id,
    jsonb_build_object(
      'community_id', T.community_id,
      'id', T.topic_id,
      'name', Tp.name,
      'description', Tp.description
    ) as topic,
    COALESCE(
      (SELECT jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
        'id', C.id,
        'address', C.address,
        'user_id', C.user_id,
        'user_tier', C.user_tier,
        'profile_name', C.profile_name,
        'profile_avatar', C.profile_avatar,
        'body', C.body,
        'content_url', C.content_url,
        'created_at', C.created_at::text,
        'updated_at', C.updated_at::text,
        'deleted_at', C.deleted_at::text,
        'marked_as_spam_at', C.marked_as_spam_at::text,
        'discord_meta', C.discord_meta
      )) ORDER BY C.created_at DESC)
        FROM (
          SELECT
            C.*,
            A.address,
            U.id as user_id,
            U.tier as user_tier,
            U.profile->>'name' as profile_name,
            U.profile->>'avatar_url' as profile_avatar,
            ROW_NUMBER() OVER (PARTITION BY C.thread_id ORDER BY C.created_at DESC) AS rn
          FROM "Comments" C
                  JOIN "Addresses" A on C.address_id = A.id
                  JOIN "Users" U on A.user_id = U.id
          WHERE
            C.thread_id = T.id
            AND C.deleted_at IS NULL
        ) C WHERE C.rn <= :comment_limit), '[]') as comments
  FROM
    top_threads T
      JOIN "Addresses" A ON A.id = T.address_id AND A.community_id = T.community_id
      JOIN "Users" U ON U.id = A.user_id
      JOIN "Topics" Tp ON Tp.id = T.topic_id
`;

export async function getUserActivityFeed({
  user_id = 0,
  comment_limit,
  limit,
  cursor,
}: GetUserActivityFeedParams) {
  const offset = (cursor - 1) * limit;
  const query = `
WITH 
user_communities AS (
    SELECT DISTINCT community_id 
    FROM "Addresses" 
    WHERE user_id = :user_id
),
top_threads AS (
  SELECT
    T.*,
    count(*) OVER() AS total,
    C.icon_url
  FROM
    "Threads" T
    ${user_id ? 'JOIN user_communities UC ON UC.community_id = T.community_id' : ''}
    JOIN "Communities" C ON C.id = T.community_id
    ${joinPrivateTopics()}
  WHERE
    T.deleted_at IS NULL 
    AND T.marked_as_spam_at IS NULL 
    AND C.active IS TRUE 
    AND C.tier != ${CommunityTierMap.SpamCommunity}
    AND C.id NOT IN ('ethereum', 'cosmos', 'polkadot')
    ${filterPrivateTopics()}
  ORDER BY
    T.activity_rank_date DESC NULLS LAST
  LIMIT :limit OFFSET :offset 
)
${baseActivityQuery}
ORDER BY T.activity_rank_date DESC NULLS LAST
`;

  const threads = await models.sequelize.query<
    z.infer<typeof schemas.ThreadView> & { total?: number }
  >(query, {
    type: QueryTypes.SELECT,
    raw: true,
    replacements: { user_id, limit, comment_limit, offset },
  });

  return schemas.buildPaginatedResponse(threads, +(threads.at(0)?.total ?? 0), {
    limit,
    offset,
  });
}
