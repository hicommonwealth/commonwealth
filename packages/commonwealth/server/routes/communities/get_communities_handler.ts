import { GetActiveCommunitiesResult } from 'server/controllers/server_communities_methods/get_active_communities';
import { GetCommunitiesResult } from 'server/controllers/server_communities_methods/get_communities';
import { SearchCommunitiesResult } from 'server/controllers/server_communities_methods/search_communities';
import { ServerControllers } from '../../routing/router';
import {
  PaginationQueryParams,
  TypedRequestQuery,
  TypedResponse,
  success,
} from '../../types';

type GetCommunitiesRequestQuery = {
  active?: string;
  snapshots?: string;
  search?: string;
} & PaginationQueryParams;

type GetCommunitiesResponse =
  | GetActiveCommunitiesResult
  | GetCommunitiesResult
  | SearchCommunitiesResult;

export const getCommunitiesHandler = async (
  controllers: ServerControllers,
  req: TypedRequestQuery<GetCommunitiesRequestQuery>,
  res: TypedResponse<GetCommunitiesResponse>,
) => {
  const options = req.query;

  // get active communities
  if (options.active === 'true') {
    const results = await controllers.communities.getActiveCommunities({
      cacheEnabled: true,
    });
    return success(res, results);
  }

  // search communities
  if (options.search) {
    const results = await controllers.communities.searchCommunities({
      search: options.search,
      // @ts-expect-error StrictNullChecks
      limit: parseInt(options.limit, 10) || 0,
      // @ts-expect-error StrictNullChecks
      page: parseInt(options.page, 10) || 0,
      orderBy: options.order_by,
      orderDirection: options.order_direction as any,
    });
    return success(res, results);
  }

  const results = await controllers.communities.getCommunities({});
  return success(res, results);
};
