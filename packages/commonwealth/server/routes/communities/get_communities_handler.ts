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

type GetCommunitiesResponse = GetCommunitiesResult | SearchCommunitiesResult;

export const getCommunitiesHandler = async (
  controllers: ServerControllers,
  req: TypedRequestQuery<GetCommunitiesRequestQuery>,
  res: TypedResponse<GetCommunitiesResponse>,
) => {
  const options = req.query;

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

  // TODO: throw error here -- route no longer accessible
  const results = await controllers.communities.getCommunities({});
  return success(res, results);
};
