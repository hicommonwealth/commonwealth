import { AppError } from '@hicommonwealth/adapters';
import {
  MembershipFilters,
  SearchProfilesResult,
} from 'server/controllers/server_profiles_methods/search_profiles';
import { ALL_COMMUNITIES } from '../../middleware/databaseValidationService';
import { ServerControllers } from '../../routing/router';
import {
  PaginationQueryParams,
  TypedRequestQuery,
  TypedResponse,
  success,
} from '../../types';

const Errors = {
  InvalidCommunityId: 'Invalid community ID',
  NoCommunity: 'No community resolved to execute search',
  NoCommunityForMemberships:
    'Must specify community ID when filtering by membership status',
};

type SearchCommentsRequestParams = {
  search: string;
  community_id?: string;
  include_roles?: string;
  memberships?: MembershipFilters;
  include_group_ids?: string;
} & PaginationQueryParams;

type SearchCommentsResponse = SearchProfilesResult;

export const searchProfilesHandler = async (
  controllers: ServerControllers,
  req: TypedRequestQuery<SearchCommentsRequestParams>,
  res: TypedResponse<SearchCommentsResponse>,
) => {
  const options = req.query;
  if (!req.chain && options.community_id !== ALL_COMMUNITIES) {
    // if no chain resolved, ensure that client explicitly requested all communities
    throw new AppError(Errors.NoCommunity);
  }

  if (options.memberships && !req.chain) {
    throw new AppError(Errors.NoCommunityForMemberships);
  }

  const profileSearchResults = await controllers.profiles.searchProfiles({
    community: req.chain,
    search: options.search,
    includeRoles: options.include_roles === 'true',
    limit: parseInt(options.limit, 10) || 0,
    page: parseInt(options.page, 10) || 0,
    orderBy: options.order_by,
    orderDirection: options.order_direction as any,
    memberships: options.memberships,
    includeGroupIds: options.include_group_ids === 'true',
  });

  return success(res, profileSearchResults);
};
