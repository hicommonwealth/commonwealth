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
