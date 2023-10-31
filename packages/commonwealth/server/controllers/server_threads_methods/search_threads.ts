import { QueryTypes } from 'sequelize';
import { TypedPaginatedResult } from 'server/types';
import { CommunityInstance } from '../../models/community';
import { ThreadAttributes } from '../../models/thread';
import {
  PaginationSqlBind,
  PaginationSqlOptions,
  buildPaginatedResponse,
  buildPaginationSql,
} from '../../util/queries';
import { ServerThreadsController } from '../server_threads_controller';

export type SearchThreadsOptions = {
  chain: CommunityInstance;
  searchTerm: string;
  threadTitleOnly: boolean;
  limit?: number;
  page?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
};

export type SearchThreadsResult =
  | TypedPaginatedResult<ThreadAttributes[]>
  | ThreadAttributes[];

export async function __searchThreads(
  this: ServerThreadsController,
  {
    chain,
    searchTerm,
    threadTitleOnly,
    limit,
    page,
    orderBy,
    orderDirection,
  }: SearchThreadsOptions
): Promise<SearchThreadsResult> {
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
    chain?: string;
    searchTerm?: string;
  } = {
    searchTerm: searchTerm,
    ...paginationBind,
  };
  if (chain) {
    bind.chain = chain.id;
  }

  const chainWhere = bind.chain ? '"Threads".chain = $chain AND' : '';

  let searchWhere = `"Threads".title ILIKE '%' || $searchTerm || '%'`;
  if (!threadTitleOnly) {
    // for full search, use search column too
    searchWhere += ` OR query @@ "Threads"._search`;
  }

  const sqlBaseQuery = `
    SELECT
      "Threads".id,
      "Threads".title,
      ${threadTitleOnly ? '' : `"Threads".body,`}
      'thread' as type,
      "Addresses".id as address_id,
      "Addresses".address,
      "Addresses".community_id as address_chain,
      "Threads".created_at,
      "Threads".chain,
      ts_rank_cd("Threads"._search, query) as rank
    FROM "Threads"
    JOIN "Addresses" ON "Threads".address_id = "Addresses".id,
    websearch_to_tsquery('english', $searchTerm) as query
    WHERE
      ${chainWhere}
      "Threads".deleted_at IS NULL AND
      ${searchWhere}
    ${paginationSort}
  `;

  const sqlCountQuery = `
    SELECT
      COUNT (*) as count
    FROM "Threads"
    JOIN "Addresses" ON "Threads".address_id = "Addresses".id,
    websearch_to_tsquery('english', $searchTerm) as query
    WHERE
      ${chainWhere}
      "Threads".deleted_at IS NULL AND
      ${searchWhere}
  `;

  const [results, [{ count }]]: [any[], any[]] = await Promise.all([
    await this.models.sequelize.query(sqlBaseQuery, {
      bind,
      type: QueryTypes.SELECT,
    }),
    await this.models.sequelize.query(sqlCountQuery, {
      bind,
      type: QueryTypes.SELECT,
    }),
  ]);

  const totalResults = parseInt(count, 10);

  return buildPaginatedResponse(results, totalResults, bind);
}
