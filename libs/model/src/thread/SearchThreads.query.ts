import { Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import {
  PaginationSqlOptions,
  buildPaginatedResponse,
  buildPaginationSql,
} from '@hicommonwealth/schemas';
import { ALL_COMMUNITIES } from '@hicommonwealth/shared';
import { QueryTypes } from 'sequelize';
import { z } from 'zod';
import { models } from '../database';

export function SearchThreads(): Query<typeof schemas.SearchThreads> {
  return {
    ...schemas.SearchThreads,
    auth: [],
    secure: false,
    body: async ({ payload }) => {
      const {
        communityId,
        searchTerm,
        threadTitleOnly,
        limit,
        page,
        orderBy,
        orderDirection,
        includeCount,
      } = payload;

      // sort by rank by default
      let sortOptions: PaginationSqlOptions = {
        limit: limit || 10,
        page: page || 1,
        orderDirection,
      };
      switch (orderBy) {
        case 'created_at':
          sortOptions = {
            ...sortOptions,
            orderBy: `"Threads".${orderBy}`,
          };
          break;
        default:
          sortOptions = {
            ...sortOptions,
            orderBy: `rank`,
            orderBySecondary: `"Threads".created_at`,
            orderDirectionSecondary: 'DESC',
          };
      }

      const { sql: paginationSort, bind: paginationBind } =
        buildPaginationSql(sortOptions);

      const bind = {
        community:
          communityId && communityId !== ALL_COMMUNITIES
            ? communityId
            : undefined,
        searchTerm: searchTerm,
        ...paginationBind,
      };

      const sql = `
SELECT 
  "Threads".id,
  "Threads".title,
  ${threadTitleOnly ? '' : `"Threads".body,`}
  'thread' as type,
  "Addresses".id as address_id,
  "Addresses".user_id as address_user_id,
  "Addresses".address,
  "Addresses".community_id as address_community_id,
  "Threads".created_at,
  "Threads".community_id as community_id,
  COUNT(*) OVER() AS total_count, 
  ts_rank_cd("Threads".search, tsquery) as rank
FROM 
  "Threads"
  JOIN "Addresses" ON "Threads".address_id = "Addresses".id,
  websearch_to_tsquery('english', $searchTerm) as tsquery
WHERE
  "Threads".deleted_at IS NULL
  ${bind.community ? 'AND "Threads".community_id = $community' : ''} 
  AND ("Threads".title ILIKE '%' || $searchTerm || '%' 
  ${!threadTitleOnly ? 'OR tsquery @@ "Threads".search' : ''})
${paginationSort}`;

      const results = await models.sequelize.query<
        z.infer<typeof schemas.ThreadView> & { total_count: number }
      >(sql, {
        bind,
        type: QueryTypes.SELECT,
        raw: true,
      });

      const totalResults = includeCount
        ? results.length > 0
          ? results[0].total_count
          : 0
        : results.length;

      return buildPaginatedResponse(results, totalResults, bind);
    },
  };
}
