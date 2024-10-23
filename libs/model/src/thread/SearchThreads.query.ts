import { Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import {
  PaginationSqlBind,
  PaginationSqlOptions,
  buildPaginatedResponse,
  buildPaginationSql,
} from '@hicommonwealth/schemas';
import { ALL_COMMUNITIES } from '@hicommonwealth/shared';
import { QueryTypes } from 'sequelize';
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

      const bind: PaginationSqlBind & {
        community?: string;
        searchTerm?: string;
      } = {
        searchTerm: searchTerm,
        ...paginationBind,
      };
      if (communityId && communityId !== ALL_COMMUNITIES) {
        bind.community = communityId;
      }

      const communityWhere = bind.community
        ? '"Threads".community_id = $community AND'
        : '';

      let searchWhere = `"Threads".title ILIKE '%' || $searchTerm || '%'`;
      if (!threadTitleOnly) {
        searchWhere = `("Threads".title ILIKE '%' || $searchTerm || '%' OR query @@ "Threads".search)`;
      }

      const sqlBaseQuery = `
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
      ts_rank_cd("Threads".search, query) as rank
    FROM "Threads"
    JOIN "Addresses" ON "Threads".address_id = "Addresses".id,
    websearch_to_tsquery('english', $searchTerm) as query
    WHERE
      ${communityWhere}
      "Threads".deleted_at IS NULL AND
      (${searchWhere})
    ${paginationSort}
  `;

      const sqlCountQuery = `
    SELECT
      COUNT (*) as count
    FROM "Threads"
    JOIN "Addresses" ON "Threads".address_id = "Addresses".id,
    websearch_to_tsquery('english', $searchTerm) as query
    WHERE
      ${communityWhere}
      "Threads".deleted_at IS NULL AND
      ${searchWhere}
  `;

      const [results, [{ count }]]: [any[], any[]] = await Promise.all([
        await models.sequelize.query(sqlBaseQuery, {
          bind,
          type: QueryTypes.SELECT,
        }),
        !includeCount
          ? [{ count: 0 }]
          : await models.sequelize.query(sqlCountQuery, {
              bind,
              type: QueryTypes.SELECT,
            }),
      ]);

      const totalResults = parseInt(count, 10);

      return buildPaginatedResponse(results, totalResults, bind);
    },
  };
}
