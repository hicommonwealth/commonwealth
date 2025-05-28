import { Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { ALL_COMMUNITIES } from '@hicommonwealth/shared';
import { QueryTypes } from 'sequelize';
import { z } from 'zod';
import { models } from '../../database';
import { authOptional } from '../../middleware';
import { PrivateTopics } from '../../utils/privateTopics';

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

      // sort by rank by default
      let sortOptions: schemas.PaginationSqlOptions = {
        limit: limit || 10,
        page: cursor || 1,
        orderDirection: order_direction || 'DESC',
      };
      switch (order_by) {
        case 'created_at':
          sortOptions = {
            ...sortOptions,
            orderBy: `T.${order_by}`,
          };
          break;
        default:
          sortOptions = {
            ...sortOptions,
            orderBy: `rank`,
            orderBySecondary: `T.created_at`,
            orderDirectionSecondary: 'DESC',
          };
      }

      const { sql: paginationSort, bind: paginationBind } =
        schemas.buildPaginationSql(sortOptions);

      const bind = {
        address_id: context?.address?.id || -1,
        community:
          community_id && community_id !== ALL_COMMUNITIES
            ? community_id
            : undefined,
        searchTerm: search_term,
        ...paginationBind,
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
    LEFT JOIN ${PrivateTopics} ON T.topic_id = PrivateTopics.topic_id
    , websearch_to_tsquery('english', $searchTerm) as tsquery
WHERE
  COALESCE(PrivateTopics.address_id, $address_id) = $address_id AND   
  T.deleted_at IS NULL AND
  T.marked_as_spam_at IS NULL
  ${bind.community ? 'AND T.community_id = $community' : ''} 
  AND (T.title ILIKE '%' || $searchTerm || '%' 
  ${!thread_title_only ? 'OR tsquery @@ T.search' : ''})
${paginationSort}
`;

      const results = await models.sequelize.query<
        z.infer<typeof schemas.ThreadView> & { total_count: number }
      >(sql, {
        bind,
        type: QueryTypes.SELECT,
        raw: true,
      });

      const totalResults = include_count
        ? results.length > 0
          ? results[0].total_count
          : 0
        : results.length;

      return schemas.buildPaginatedResponse(results, totalResults, bind);
    },
  };
}
