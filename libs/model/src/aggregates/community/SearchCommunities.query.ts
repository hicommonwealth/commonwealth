import { Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';

export function SearchCommunities(): Query<typeof schemas.SearchCommunities> {
  return {
    ...schemas.SearchCommunities,
    auth: [],
    secure: true,
    body: async ({ payload }) => {
      const { search, limit, page, orderBy, orderDirection } = payload;
    },
  };
}

/*
import { AppError } from '@hicommonwealth/core';
import {
  SearchCommunitiesOptions,
  SearchCommunitiesResult,
} from 'server/controllers/server_communities_methods/search_communities';
import { ServerControllers } from '../../routing/router';
import {
  PaginationQueryParams,
  TypedRequestQuery,
  TypedResponse,
  success,
} from '../../types';

const Errors = {
  QueryRequired: 'query is required',
};

type GetCommunitiesRequestQuery = {
  active?: string;
  snapshots?: string;
  search?: string;
} & PaginationQueryParams;

type GetCommunitiesResponse = SearchCommunitiesResult;

export const getCommunitiesHandler = async (
  controllers: ServerControllers,
  req: TypedRequestQuery<GetCommunitiesRequestQuery>,
  res: TypedResponse<GetCommunitiesResponse>,
) => {
  const options = req.query;

  if (!options.search) {
    throw new AppError(Errors.QueryRequired);
  }

  // search communities
  const results = await controllers.communities.searchCommunities({
    search: options.search,
    // @ts-expect-error StrictNullChecks
    limit: parseInt(options.limit, 10) || 0,
    // @ts-expect-error StrictNullChecks
    page: parseInt(options.page, 10) || 0,
    orderBy: options.order_by,
    orderDirection:
      options.order_direction as SearchCommunitiesOptions['orderDirection'],
  });
  return success(res, results);
};
*/

/*
import { buildPaginatedResponse } from '@hicommonwealth/schemas';
import { QueryTypes } from 'sequelize';
import { TypedPaginatedResult } from 'server/types';
import { PaginationSqlOptions, buildPaginationSql } from '../../util/queries';
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
  { search, limit, page, orderBy, orderDirection }: SearchCommunitiesOptions,
): Promise<SearchCommunitiesResult> {
  let sortOptions: PaginationSqlOptions = {
    // @ts-expect-error StrictNullChecks
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
        orderBy: `"Communities".${orderBy}`,
      };
      break;
    default:
      sortOptions = {
        ...sortOptions,
        orderBy: `"Communities".created_at`,
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
      "Communities".id,
      "Communities".name,
      "Communities".default_symbol,
      "Communities".type,
      "Communities".icon_url,
      "Communities".created_at
    FROM "Communities"
    WHERE
      "Communities".active = TRUE AND
      (
        "Communities".name ILIKE '%' || $searchTerm || '%'
        OR
        "Communities".default_symbol ILIKE '%' || $searchTerm || '%'
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
      },
    ),
  ]);

  const totalResults = parseInt(count, 10);

  return buildPaginatedResponse(results, totalResults, bind);
}

*/
