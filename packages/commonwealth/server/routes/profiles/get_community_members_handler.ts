import { SearchProfilesResult } from 'server/controllers/server_profiles_methods/search_profiles';
import { ServerControllers } from '../../routing/router';
import {
  PaginationQueryParams,
  TypedRequestQuery,
  TypedResponse,
  success,
} from '../../types';

export type MembershipFilters =
  | 'in-group'
  | `in-group:${number}`
  | 'not-in-group';

type GetCommunityMembersQuery = {
  search: string;
  community_id?: string;
  include_roles?: string;
  memberships?: MembershipFilters;
  include_group_ids?: string;
  include_stake_balances?: string;
} & PaginationQueryParams;

type GetCommunityMembersResponse = SearchProfilesResult;

export const getCommunityMembersHandler = async (
  controllers: ServerControllers,
  req: TypedRequestQuery<GetCommunityMembersQuery>,
  res: TypedResponse<GetCommunityMembersResponse>,
) => {
  const options = req.query;

  const results = await controllers.profiles.getCommunityMembers({
    communityId: options.community_id,
    search: options.search,
    includeRoles: options.include_roles === 'true',
    limit: parseInt(options.limit, 10) || 0,
    page: parseInt(options.page, 10) || 0,
    orderBy: options.order_by,
    orderDirection: options.order_direction as any,
    memberships: options.memberships,
    includeGroupIds: options.include_group_ids === 'true',
    includeStakeBalances: options.include_stake_balances === 'true',
  });

  return success(res, results);
};
