import {
  PaginationQueryParams,
  TypedRequestQuery,
  TypedResponse,
  success,
} from '../../types';
import { ServerControllers } from '../../routing/router';
import { AppError } from '../../../../common-common/src/errors';
import { ALL_CHAINS } from '../../middleware/databaseValidationService';
import { SearchProfilesResult } from 'server/controllers/server_profiles_methods/search_profiles';

const Errors = {
  InvalidChain: 'Invalid chain',
  NoChains: 'No chains resolved to execute search',
};

type SearchCommentsRequestParams = {
  search: string;
  community?: string;
  include_roles?: string;
} & PaginationQueryParams;

type SearchCommentsResponse = SearchProfilesResult;

export const searchProfilesHandler = async (
  controllers: ServerControllers,
  req: TypedRequestQuery<SearchCommentsRequestParams>,
  res: TypedResponse<SearchCommentsResponse>
) => {
  const options = req.query;
  if (!options.community) {
    throw new AppError(Errors.NoChains);
  }
  if (!req.chain && options.community !== ALL_CHAINS) {
    // if no chain resolved, ensure that client explicitly requested all chains
    throw new AppError(Errors.NoChains);
  }

  const profileSearchResults = await controllers.profiles.searchProfiles({
    community: req.chain,
    search: options.search,
    includeRoles: options.include_roles === 'true',
    limit: parseInt(options.limit, 10) || 0,
    page: parseInt(options.page, 10) || 0,
    orderBy: options.order_by,
    orderDirection: options.order_direction as any,
  });

  return success(res, profileSearchResults);
};
