import { Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { ALL_COMMUNITIES } from '@hicommonwealth/shared';
import { QueryTypes } from 'sequelize';
import { z } from 'zod';
import { models } from '../../database';
import { authOptionalVerified } from '../../middleware';
import { buildOpenGates } from '../../utils/gating';

export function SearchThreads(): Query<typeof schemas.SearchThreads> {
  return {
    ...schemas.SearchThreads,
    auth: [authOptionalVerified],
    secure: true,
    body: async ({ actor, payload }) => {
      const {
        community_id,
        search_term,
        thread_title_only,
        limit,
        cursor,
        order_by,
        order_direction,
        include_count,
      } = payload;

      const replacements = {
        address_id: actor.address_id,
        community_id:
          community_id && community_id !== ALL_COMMUNITIES
            ? community_id
            : undefined,
        search_term,
        limit,
        offset: limit * (cursor - 1),
      };

      const sql = `
WITH threads AS (
SELECT 
  'thread' as type,
  T.community_id,
  T.topic_id,
  T.id,
  T.title,
  ${thread_title_only ? `''` : `T.body`} as body,
  T.kind,
  T.created_at,
  T.address_id,
  JSONB_BUILD_OBJECT(
    'id', A.id,
    'user_id', A.user_id,
    'address', A.address
  ) as Address,
  A.last_active as address_last_active,
  U.id as user_id,
  U.tier as user_tier,
  U.profile->>'avatar_url' as avatar_url,
  U.profile->>'name' as profile_name,
  ts_rank_cd(T.search, tsquery) as rank
FROM 
    "Threads" T
    JOIN "Addresses" A ON T.address_id = A.id
    JOIN "Users" U ON A.user_id = U.id
    , websearch_to_tsquery('english', :search_term) as tsquery
WHERE
  T.deleted_at IS NULL
  AND T.marked_as_spam_at IS NULL
  ${replacements.community_id ? 'AND T.community_id = :community_id' : ''} 
  AND (T.title ILIKE '%' || :search_term || '%' ${!thread_title_only ? 'OR tsquery @@ T.search' : ''})
),
${
  actor.address_id
    ? // authenticated users are gated by group memberships
      `
${buildOpenGates(actor)},
gated_threads AS (
  SELECT  
    T.*
  FROM
    threads T
    JOIN open_gates og ON T.topic_id = og.topic_id
)
`
    : // otherwise only public threads are returned
      `
private_gates AS (
  SELECT DISTINCT ga.topic_id
  FROM
    "GroupGatedActions" ga
    JOIN threads T ON ga.topic_id = T.topic_id
  WHERE
    ga.is_private = TRUE
),
gated_threads AS (
  SELECT
    T.*
  FROM
    threads T
    LEFT JOIN private_gates pg ON T.topic_id = pg.topic_id
  WHERE
    pg.topic_id IS NULL
)
`
}  
SELECT
  T.*,
  COUNT(*) OVER()::INTEGER AS total_count
FROM
  gated_threads T
ORDER BY
  ${order_by === 'created_at' ? `T.${order_by} ${order_direction || 'DESC'}` : `rank, T.created_at DESC`}
LIMIT :limit OFFSET :offset
`;

      const results = await models.sequelize.query<
        z.infer<typeof schemas.ThreadView> & { total_count: number }
      >(sql, {
        type: QueryTypes.SELECT,
        replacements,
        raw: true,
      });

      const totalResults = include_count
        ? results.length > 0
          ? results[0].total_count
          : 0
        : results.length;

      return schemas.buildPaginatedResponse(results, totalResults, {
        cursor,
        limit,
      });
    },
  };
}
