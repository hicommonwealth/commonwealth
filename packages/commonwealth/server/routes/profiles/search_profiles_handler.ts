import { AppError } from '@hicommonwealth/core';
import { SearchProfilesResult } from '../../controllers/server_profiles_methods/search_profiles';
import { ALL_COMMUNITIES } from '../../middleware/databaseValidationService';
import { ServerControllers } from '../../routing/router';
import {
  PaginationQueryParams,
  TypedRequestQuery,
  TypedResponse,
  success,
} from '../../types';

const Errors = {
  NoCommunity: 'No community resolved to execute search',
};

type SearchProfilesRequestParams = {
  search: string;
  community_id?: string;
  include_roles?: string;
  include_group_ids?: string;
} & PaginationQueryParams;

type SearchProfilesResponse = SearchProfilesResult;

export const searchProfilesHandler = async (
  controllers: ServerControllers,
  req: TypedRequestQuery<SearchProfilesRequestParams>,
  res: TypedResponse<SearchProfilesResponse>,
) => {
  const options = req.query;
  if (!req.community && options.community_id !== ALL_COMMUNITIES) {
    // if no community resolved, ensure that client explicitly requested all communities
    throw new AppError(Errors.NoCommunity);
  }

  const profileSearchResults = await controllers.profiles.searchProfiles({
    community: req.community,
    search: options.search,
    includeRoles: options.include_roles === 'true',
    limit: parseInt(options.limit, 10) || 0,
    page: parseInt(options.page, 10) || 0,
    orderBy: options.order_by,
    orderDirection: options.order_direction as any,
    includeGroupIds: options.include_group_ids === 'true',
  });

  return success(res, profileSearchResults);
};
