import { type Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { QueryTypes } from 'sequelize';
import { models } from '../database';

export function SearchComments(): Query<typeof schemas.SearchComments> {
  return {
    ...schemas.SearchComments,
    auth: [],
    body: async ({ payload }) => {
      const { community_id, search, limit, page, orderBy, orderDirection } =
        payload;
      // sort by rank by default
      let sortOptions: schemas.PaginationSqlOptions = {
        limit: Math.min(limit, 100) || 10,
        page: page || 1,
        orderDirection,
      };
      switch (orderBy) {
        case 'created_at':
          sortOptions = {
            ...sortOptions,
            orderBy: `"Comments".${orderBy}`,
          };
          break;
        default:
          sortOptions = {
            ...sortOptions,
            orderBy: `rank`,
            orderBySecondary: `"Comments".created_at`,
            orderDirectionSecondary: 'DESC',
          };
      }

      const { sql: paginationSort, bind: paginationBind } =
        schemas.buildPaginationSql(sortOptions);

      const bind: {
        searchTerm?: string;
        community?: string;
        limit?: number;
      } = {
        searchTerm: search,
        ...paginationBind,
      };
      if (community_id) {
        bind.community = community_id;
      }

      const communityWhere = bind.community
        ? '"Comments".community_id = $community AND'
        : '';

      const sqlBaseQuery = `
    SELECT
      "Comments".id,
      "Threads".title,
      "Comments".text,
      "Comments".thread_id as proposalId,
      'comment' as type,
      "Addresses".id as address_id,
      "Addresses".address,
      "Addresses".community_id as address_community_id,
      "Comments".created_at,
      "Threads".community_id as community_id,
      ts_rank_cd("Comments"._search, query) as rank
    FROM "Comments"
    JOIN "Threads" ON "Comments".thread_id = "Threads".id
    JOIN "Addresses" ON "Comments".address_id = "Addresses".id,
    websearch_to_tsquery('english', $searchTerm) as query
    WHERE
      ${communityWhere}
      "Comments".deleted_at IS NULL AND
      query @@ "Comments"._search
    ${paginationSort}
  `;

      const sqlCountQuery = `
    SELECT
      COUNT (*) as count
    FROM "Comments"
    JOIN "Threads" ON "Comments".thread_id = "Threads".id
    JOIN "Addresses" ON "Comments".address_id = "Addresses".id,
    websearch_to_tsquery('english', $searchTerm) as query
    WHERE
      ${communityWhere}
      "Comments".deleted_at IS NULL AND
      query @@ "Comments"._search
  `;

      const [results, [{ count }]]: [any[], any[]] = await Promise.all([
        models.sequelize.query(sqlBaseQuery, {
          bind,
          type: QueryTypes.SELECT,
        }),
        models.sequelize.query(sqlCountQuery, {
          bind,
          type: QueryTypes.SELECT,
        }),
      ]);

      const totalResults = parseInt(count, 10);

      return schemas.buildPaginatedResponse(results, totalResults, bind);
    },
  };
}
