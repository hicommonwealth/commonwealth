import {
  PaginationQueryParams,
  TypedRequestQuery,
  TypedResponse,
  success,
} from '../../types';
import { ServerControllers } from '../../routing/router';
import { GetCommunitiesWithSnapshotsResult } from 'server/controllers/server_communities_methods/get_communities_with_snapshots';
import { SearchCommunitiesResult } from 'server/controllers/server_communities_methods/search_communities';
import { AppError } from '../../../../common-common/src/errors';

const Errors = {
  InvalidRequest: 'Invalid request',
};

type GetChainsRequestParams = {
  snapshots?: boolean;
  search?: string;
} & PaginationQueryParams;

export const getChainsHandler = async (
  controllers: ServerControllers,
  req: TypedRequestQuery<GetChainsRequestParams>,
  res: TypedResponse<
    GetCommunitiesWithSnapshotsResult | SearchCommunitiesResult
  >
) => {
  const options = req.query;

  // get chains, with snapshots
  if (options.snapshots) {
    const results = await controllers.communities.getCommunitiesWithSnapshots(
      {}
    );
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
