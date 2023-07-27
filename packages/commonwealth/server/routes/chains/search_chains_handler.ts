import {
  PaginationQueryParams,
  TypedRequestQuery,
  TypedResponse,
  success,
} from '../../types';
import { ServerControllers } from '../../routing/router';
import { SearchChainsResult } from 'server/controllers/server_chains_methods/search_chains';

export const MIN_COMMENT_SEARCH_QUERY_LENGTH = 4;

type SearchChainsRequestParams = {
  search: string;
} & PaginationQueryParams;

type SearchChainsResponse = SearchChainsResult;

export const searchChainsHandler = async (
  controllers: ServerControllers,
  req: TypedRequestQuery<SearchChainsRequestParams>,
  res: TypedResponse<SearchChainsResponse>
) => {
  const options = req.query;

  const results = await controllers.chains.searchChains({
    search: options.search,
    limit: parseInt(options.limit, 10) || 0,
    page: parseInt(options.page, 10) || 0,
    orderBy: options.order_by,
    orderDirection: options.order_direction as any,
  });

  return success(res, results);
};
