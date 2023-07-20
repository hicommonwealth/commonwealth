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
    limit: limit || 10,
    page: page || 1,
    orderDirection,
  };
  switch (orderBy) {
    case 'name':
    case 'default_symbol':
    case 'created_at':
      sortOptions = {
        ...sortOptions,
        orderBy: `"Chains".${orderBy}`,
      };
      break;
    default:
      sortOptions = {
        ...sortOptions,
        orderBy: `"Chains".created_at`,
        orderDirection: 'ASC',
      };
  }

  const { sql: paginationSort, bind: paginationBind } = buildPaginationSql(
    sortOptions
  );

  const bind = {
    searchTerm: search,
    ...paginationBind,
  };

  const sqlWithoutPagination = `
    SELECT
      "Chains".id,
      "Chains".name,
      "Chains".default_symbol,
      "Chains".type,
      "Chains".icon_url,
      "Chains".created_at
    FROM "Chains"
    WHERE
      "Chains".active = TRUE AND
      (
        "Chains".name ILIKE '%' || $searchTerm || '%'
        OR
        "Chains".default_symbol ILIKE '%' || $searchTerm || '%'
      )
  `;
  const [results, [{ count }]]: [any[], any[]] = await Promise.all([
    // get profiles and aggregate all addresses for each profile
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
