import { ChainInstance } from '../../models/chain';
import { ServerCommentsController } from '../server_comments_controller';
import {
  PaginationSqlOptions,
  buildPaginatedResponse,
  buildPaginationSql,
} from '../../util/queries';
import { QueryTypes } from 'sequelize';
import { TypedPaginatedResult } from 'server/types';

export type SearchCommentsOptions = {
  chain: ChainInstance;
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
  address_chain: string;
  created_at: string;
  chain: string;
  rank: number;
}>;

export async function __searchComments(
  this: ServerCommentsController,
  { chain, search, limit, page, orderBy, orderDirection }: SearchCommentsOptions
): Promise<SearchCommentsResult> {
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
        orderBy: `"Comments".${orderBy}`,
      };
      break;
    default:
      sortOptions = {
        ...sortOptions,
        orderBy: `rank`,
      };
  }

  const { sql: paginationSort, bind: paginationBind } =
    buildPaginationSql(sortOptions);

  const bind: {
    searchTerm?: string;
    chain?: string;
    limit?: number;
  } = {
    searchTerm: search,
    ...paginationBind,
  };
  if (chain) {
    bind.chain = chain.id;
  }

  const chainWhere = bind.chain ? '"Comments".chain = $chain AND' : '';

  const sqlBaseQuery = `
    SELECT
      "Comments".id,
      "Threads".title,
      "Comments".text,
      "Comments".thread_id as proposalId,
      'comment' as type,
      "Addresses".id as address_id,
      "Addresses".address,
      "Addresses".chain as address_chain,
      "Comments".created_at,
      "Threads".chain,
      ts_rank_cd("Comments"._search, query) as rank
    FROM "Comments"
    JOIN "Threads" ON "Comments".thread_id = "Threads".id
    JOIN "Addresses" ON "Comments".address_id = "Addresses".id,
    websearch_to_tsquery('english', $searchTerm) as query
    WHERE
      ${chainWhere}
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
      ${chainWhere}
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
