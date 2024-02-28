import { AppError } from '@hicommonwealth/core';
import { GetCommunitiesResult } from '../../controllers/server_communities_methods/get_communities';
import { SearchCommunitiesResult } from '../../controllers/server_communities_methods/search_communities';
import { ServerControllers } from '../../routing/router';
import {
  PaginationQueryParams,
  TypedRequestQuery,
  TypedResponse,
  success,
} from '../../types';

const Errors = {
  InvalidRequest: 'Invalid request',
};

type GetCommunitiesRequestQuery = {
  snapshots?: string;
  search?: string;
} & PaginationQueryParams;

type GetCommunitiesResponse = GetCommunitiesResult | SearchCommunitiesResult;

export const getCommunitiesHandler = async (
  controllers: ServerControllers,
  req: TypedRequestQuery<GetCommunitiesRequestQuery>,
  res: TypedResponse<GetCommunitiesResponse>,
) => {
  const options = req.query;

  // get chains, with snapshots
  if (options.snapshots === 'true') {
    const results = await controllers.communities.getCommunities({});
    return success(res, results);
  }

  // search chains
  if (options.search) {
    const results = await controllers.communities.searchCommunities({
      search: options.search,
      limit: parseInt(options.limit, 10) || 0,
      page: parseInt(options.page, 10) || 0,
      orderBy: options.order_by,
      orderDirection: options.order_direction as any,
    });
    return success(res, results);
  }

  throw new AppError(Errors.InvalidRequest);
};
