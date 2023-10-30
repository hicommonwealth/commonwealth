import {
  PaginationSqlOptions,
  buildPaginatedResponse,
  buildPaginationSql,
} from '../../util/queries';
import { QueryTypes } from 'sequelize';
import { TypedPaginatedResult } from 'server/types';
import { ServerCommunitiesController } from '../server_communities_controller';

export type SearchCommunitiesOptions = {
  search: string;
  limit?: number;
  page?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
};
export type SearchCommunitiesResult = TypedPaginatedResult<{
  id: number;
  iconUrl: string;
}>;

export async function __searchCommunities(
  this: ServerCommunitiesController,
  { search, limit, page, orderBy, orderDirection }: SearchCommunitiesOptions
): Promise<SearchCommunitiesResult> {
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

  const { sql: paginationSort, bind: paginationBind } =
    buildPaginationSql(sortOptions);

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
