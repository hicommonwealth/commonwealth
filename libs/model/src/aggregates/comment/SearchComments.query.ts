import { type Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { ALL_COMMUNITIES } from '@hicommonwealth/shared';
import { QueryTypes } from 'sequelize';
import { models } from '../../database';

export function SearchComments(): Query<typeof schemas.SearchComments> {
  return {
    ...schemas.SearchComments,
    auth: [],
    body: async ({ payload }) => {
      const { community_id, search, limit, cursor, order_by, order_direction } =
        payload;
      // sort by rank by default
      let sortOptions: schemas.PaginationSqlOptions = {
        limit: Math.min(limit, 100) || 10,
        page: cursor || 1,
        orderDirection: order_direction,
      };
      switch (order_by) {
        case 'created_at':
          sortOptions = {
            ...sortOptions,
            orderBy: `"Comments".${order_by}`,
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
      if (community_id && community_id !== ALL_COMMUNITIES) {
        bind.community = community_id;
      }

      const communityWhere = bind.community
        ? '"Threads".community_id = $community AND'
        : '';

      const sqlBaseQuery = `
    SELECT
      "Comments".id,
      "Threads".title,
      "Comments".body,
      "Comments".thread_id,
      'comment' as type,
      "Addresses".id as address_id,
      "Addresses".address,
      "Addresses".community_id as address_community_id,
      "Comments".created_at,
      "Threads".community_id as community_id,
      ts_rank_cd("Comments".search, query) as rank
    FROM "Comments"
      JOIN "Threads" ON "Comments".thread_id = "Threads".id
      JOIN "Addresses" ON "Comments".address_id = "Addresses".id,
      websearch_to_tsquery('english', $searchTerm) as query
    WHERE
      ${communityWhere}
      "Comments".deleted_at IS NULL AND
      "Comments".marked_as_spam_at IS NULL AND
      query @@ "Comments".search
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
      "Comments".marked_as_spam_at IS NULL AND
      query @@ "Comments".search
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

      return schemas.buildPaginatedResponse(results, parseInt(count, 10), bind);
    },
  };
}
