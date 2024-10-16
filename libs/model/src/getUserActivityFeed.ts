import { ActivityFeed, ActivityThread } from '@hicommonwealth/schemas';
import { QueryTypes } from 'sequelize';
import { z } from 'zod';
import { models } from './database';

/**
 * Gets last updated threads and their recent comments
 * @param user_id by user id communities, 0 for global
 * @param thread_limit thread limit
 * @param comment_limit comment limit
 */
export async function getUserActivityFeed({
  user_id = 0,
  thread_limit = 50,
  comment_limit = 3,
}: z.infer<typeof ActivityFeed.input> & { user_id?: number }) {
  const query = `
WITH 
user_communities AS (
    SELECT DISTINCT community_id 
    FROM "Addresses" 
    WHERE user_id = :user_id
),
top_threads AS (
    SELECT T.*
    FROM "Threads" T
    ${user_id ? 'JOIN user_communities UC ON UC.community_id = T.community_id' : ''}
    WHERE T.deleted_at IS NULL
    ORDER BY T.activity_rank_date DESC NULLS LAST
    LIMIT :thread_limit
)
SELECT 
  jsonb_set(
    jsonb_build_object(
      'community_id', C.id,
      'community_icon', C.icon_url,
      'id', T.id,
      'user_id', U.id,
      'user_address', A.address,
      'profile_name', U.profile->>'name',
      'profile_avatar', U.profile->>'avatar_url',
      'body', T.body,
      'title', T.title,
      'kind', T.kind,
      'stage', T.stage,
      'number_of_comments', coalesce(T.comment_count, 0),
      'created_at', T.created_at::text,
      'updated_at', T.updated_at::text,
      'deleted_at', T.deleted_at::text,
      'locked_at', T.locked_at::text,
      'archived_at', T.archived_at::text,
      'marked_as_spam_at', T.marked_as_spam_at::text,
      'read_only', T.read_only,
      'has_poll', T.has_poll,
      'discord_meta', T.discord_meta,
      'topic', jsonb_build_object(
        'id', T.topic_id,
        'name', Tp.name,
        'description', Tp.description
      )
    ),
    '{recent_comments}', 
    COALESCE(
      (SELECT jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
        'id', C.id,
        'address', C.address,
        'user_id', C.user_id,
        'profile_name', C.profile_name,
        'profile_avatar', C.profile_avatar,
        'text', C.text,
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
            U.profile->>'name' as profile_name, 
            U.profile->>'avatar_url' as profile_avatar, 
            ROW_NUMBER() OVER (PARTITION BY C.thread_id ORDER BY C.created_at DESC) AS rn
          FROM "Comments" C
            JOIN "Addresses" A on C.address_id = A.id
            JOIN "Users" U on A.user_id = U.id
          WHERE 
            C.thread_id = T.id 
            AND C.deleted_at IS NULL
      ) C WHERE C.rn <= :comment_limit), '[]')
  ) AS thread
FROM
  top_threads T
  JOIN "Communities" C ON T.community_id = C.id
  JOIN "Addresses" A ON A.id = T.address_id AND A.community_id = T.community_id
  JOIN "Users" U ON U.id = A.user_id
  JOIN "Topics" Tp ON Tp.id = T.topic_id
ORDER BY
  T.activity_rank_date DESC NULLS LAST;
  `;

  const threads = await models.sequelize.query<{
    thread: z.infer<typeof ActivityThread>;
  }>(query, {
    type: QueryTypes.SELECT,
    raw: true,
    replacements: { user_id, thread_limit, comment_limit },
  });

  return threads.map((t) => t.thread);
}
