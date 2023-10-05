import {
  PaginationSqlOptions,
  buildPaginatedResponse,
  buildPaginationSql,
} from '../../util/queries';
import { QueryTypes } from 'sequelize';
import { TypedPaginatedResult } from 'server/types';
import { ServerChainsController } from '../server_chains_controller';

export type SearchChainsOptions = {
  search: string;
  limit?: number;
  page?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
};
export type SearchChainsResult = TypedPaginatedResult<{
  id: number;
  iconUrl: string;
}>;

export async function __searchChains(
  this: ServerChainsController,
  { search, limit, page, orderBy, orderDirection }: SearchChainsOptions
): Promise<SearchChainsResult> {
  let sortOptions: PaginationSqlOptions = {
    limit: Math.min(limit, 100) || 10,
    page: page || 1,
    orderDirection,
  };
  switch (orderBy) {
    case 'name':
    case 'default_symbol':
    case 'created_at':
      sortOptions = {
        ...sortOptions,
        orderBy: `C.${orderBy}`,
      };
      break;
    default:
      sortOptions = {
        ...sortOptions,
        orderBy: `C.created_at`,
        orderDirection: 'ASC',
      };
  }

  const { sql: paginationSort, bind: paginationBind } =
    buildPaginationSql(sortOptions);

  const bind = {
    searchTerm: search,
    ...paginationBind,
  };

  const sqlWithoutPagination = `
    SELECT
      C.id,
      C.name,
      C.default_symbol,
      C.type,
      C.icon_url,
      C.created_at
    FROM "Communities" C
    WHERE
      C.active = TRUE AND
      (
        C.name ILIKE '%' || $searchTerm || '%'
        OR
        C.default_symbol ILIKE '%' || $searchTerm || '%'
      )
  `;
  const [results, [{ count }]]: [any[], any[]] = await Promise.all([
    this.models.sequelize.query(`${sqlWithoutPagination} ${paginationSort}`, {
      bind,
      type: QueryTypes.SELECT,
    }),
    this.models.sequelize.query(
      `SELECT COUNT(*) FROM ( ${sqlWithoutPagination} ) as count`,
      {
        bind,
        type: QueryTypes.SELECT,
      }
    ),
  ]);

  const totalResults = parseInt(count, 10);

  return buildPaginatedResponse(results, totalResults, bind);
}
