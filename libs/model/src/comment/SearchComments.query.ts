import {
  PaginationSqlOptions,
  QueryMetadata,
  TypedPaginatedResult,
  buildPaginatedResponse,
  buildPaginationSql,
} from '@hicommonwealth/core';
import { QueryTypes } from 'sequelize';
import { z } from 'zod';
import { models } from '../database';
import type { CommentAttributes } from '../models';

const schema = z.object({
  community_id: z.string(),
  search: z.string(),
  limit: z.number().optional().default(20),
  page: z.number().optional().default(1),
  orderBy: z.string().optional().default('created_at'),
  orderDirection: z.enum(['ASC', 'DESC']).default('DESC'),
});

export const SearchComments = (): QueryMetadata<
  TypedPaginatedResult<CommentAttributes>,
  typeof schema
> => ({
  schema,
  auth: [],
  body: async ({ payload }) => {
    const { community_id, search, limit, page, orderBy, orderDirection } =
      payload;
    // sort by rank by default
    let sortOptions: PaginationSqlOptions = {
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
      buildPaginationSql(sortOptions);

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

    return buildPaginatedResponse(results, totalResults, bind);
  },
});
