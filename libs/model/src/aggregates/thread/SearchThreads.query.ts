import { Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { ALL_COMMUNITIES } from '@hicommonwealth/shared';
import { QueryTypes } from 'sequelize';
import { z } from 'zod';
import { models } from '../../database';
import { authOptional } from '../../middleware';
import {
  filterPrivateTopics,
  joinPrivateTopics,
} from '../../utils/privateTopics';

export function SearchThreads(): Query<typeof schemas.SearchThreads> {
  return {
    ...schemas.SearchThreads,
    auth: [authOptional],
    secure: true,
    body: async ({ context, payload }) => {
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
      const address_id = context?.address?.id;

      const replacements = {
        address_id,
        community_id:
          community_id && community_id !== ALL_COMMUNITIES
            ? community_id
            : undefined,
        search_term,
        limit,
        offset: limit * (cursor - 1),
      };

      const sql = `
SELECT 
  'thread' as type,
  T.community_id,
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
  COUNT(*) OVER()::INTEGER AS total_count, 
  ts_rank_cd(T.search, tsquery) as rank
FROM 
    "Threads" T
    JOIN "Addresses" A ON T.address_id = A.id
    JOIN "Users" U ON A.user_id = U.id
    ${joinPrivateTopics(address_id)}
    , websearch_to_tsquery('english', :search_term) as tsquery
WHERE
  T.deleted_at IS NULL
  AND T.marked_as_spam_at IS NULL
  ${replacements.community_id ? 'AND T.community_id = :community_id' : ''} 
  ${filterPrivateTopics(address_id)}
  AND (T.title ILIKE '%' || :search_term || '%' ${!thread_title_only ? 'OR tsquery @@ T.search' : ''})
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
        logging: true,
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
