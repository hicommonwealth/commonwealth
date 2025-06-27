import { Actor } from '@hicommonwealth/core';
import { CommunityTierMap } from '@hicommonwealth/shared';

/**
 * Base query for global and user activity feeds
 * - Based on the gated top_threads CTE from the builder functions
 */
const baseActivityQuery = `
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

/**
 * Gates topics according to the actor's group memberships
 */
function buildOpenGates(actor: Actor) {
  return `
user_addresses AS (
  SELECT a.id FROM "Addresses" a WHERE a.user_id = ${actor.user.id}
),
open_gates AS (
  SELECT T.id as topic_id
  FROM
    user_addresses ua
    JOIN "Addresses" a ON ua.id = a.id
    JOIN "Topics" T ON a.community_id = T.community_id
  	LEFT JOIN "GroupGatedActions" G ON T.id = G.topic_id
  	LEFT JOIN "Memberships" M ON G.group_id = M.group_id
      AND M.address_id IN (SELECT id FROM user_addresses)
      AND M.reject_reason IS NULL
  GROUP BY
    T.id
  HAVING
    BOOL_AND(
      COALESCE(G.is_private, FALSE) = FALSE
      OR M.address_id IS NOT NULL
      OR ${actor.user?.isAdmin ? 'TRUE' : 'FALSE'}
    )
)
`;
}

/**
 * Global activity feed query builder
 * - Can be scoped to a specific community or search term
 */
export function buildGlobalActivityQuery(
  actor: Actor,
  community_id?: string,
  search?: string,
) {
  const query = `
WITH ranked_threads AS (
  SELECT
    T.*,
    C.icon_url,
    count(*) OVER () AS total
  FROM
    "Threads" T
    JOIN "Communities" C ON C.id = T.community_id 
  WHERE
    T.id IN (:threadIds)
    ${community_id ? 'AND T.community_id = :community_id' : ''}
    ${search ? 'AND T.title ILIKE :search' : ''}
),
${
  actor.address_id
    ? // authenticated users are gated by group memberships
      `
${buildOpenGates(actor)},
top_threads AS (
  SELECT  
    T.*
  FROM
    ranked_threads T
    JOIN open_gates og ON T.topic_id = og.topic_id
)
`
    : // otherwise only public threads are returned
      `
private_gates AS (
  SELECT DISTINCT ga.topic_id
  FROM
    "GroupGatedActions" ga
    JOIN ranked_threads T ON ga.topic_id = T.topic_id
  WHERE
    ga.is_private = TRUE
),
top_threads AS (
  SELECT
    T.*
  FROM
    ranked_threads T
    LEFT JOIN private_gates pg ON T.topic_id = pg.topic_id
  WHERE
    pg.topic_id IS NULL
)
`
}
${baseActivityQuery}
ORDER BY ARRAY_POSITION(ARRAY[:threadIds], T.id);
`;

  return query;
}

/**
 * User activity feed query builder
 */
export function buildUserActivityQuery(actor: Actor) {
  const query = `
WITH user_communities AS (
  SELECT DISTINCT community_id FROM "Addresses" WHERE user_id = ${actor.user?.id}
),
${buildOpenGates(actor)},
top_threads AS (
  SELECT
    T.*,
    count(*) OVER() AS total,
    C.icon_url
  FROM
    "Threads" T
    JOIN open_gates og ON T.topic_id = og.topic_id
    JOIN user_communities UC ON UC.community_id = T.community_id
    JOIN "Communities" C ON C.id = T.community_id
  WHERE
    T.deleted_at IS NULL 
    AND T.marked_as_spam_at IS NULL 
    AND C.active IS TRUE 
    AND C.tier != ${CommunityTierMap.SpamCommunity}
    AND C.id NOT IN ('ethereum', 'cosmos', 'polkadot')
  ORDER BY
    T.activity_rank_date DESC NULLS LAST
  LIMIT :limit OFFSET :offset 
)
${baseActivityQuery}
ORDER BY T.activity_rank_date DESC NULLS LAST
`;

  return query;
}
