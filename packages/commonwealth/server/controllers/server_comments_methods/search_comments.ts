import { CommunityInstance } from '@hicommonwealth/model';
import { buildPaginatedResponse } from '@hicommonwealth/schemas';
import { QueryTypes } from 'sequelize';
import { TypedPaginatedResult } from 'server/types';
import { PaginationSqlOptions, buildPaginationSql } from '../../util/queries';
import { ServerCommentsController } from '../server_comments_controller';

export type SearchCommentsOptions = {
  community: CommunityInstance;
  search: string;
  limit?: number;
  page?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
};
export type SearchCommentsResult = TypedPaginatedResult<{
  id: number;
  title: string;
  text: string;
  proposalid: number;
  type: 'comment';
  address_id: number;
  address: string;
  address_community_id: string;
  created_at: string;
  community_id: string;
  rank: number;
}>;

export async function __searchComments(
  this: ServerCommentsController,
  {
    community,
    search,
    limit,
    page,
    orderBy,
    orderDirection,
  }: SearchCommentsOptions,
): Promise<SearchCommentsResult> {
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
  if (community) {
    bind.community = community.id;
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
    this.models.sequelize.query(sqlBaseQuery, {
      bind,
      type: QueryTypes.SELECT,
    }),
    this.models.sequelize.query(sqlCountQuery, {
      bind,
      type: QueryTypes.SELECT,
    }),
  ]);

  const totalResults = parseInt(count, 10);

  return buildPaginatedResponse(results, totalResults, bind);
}
