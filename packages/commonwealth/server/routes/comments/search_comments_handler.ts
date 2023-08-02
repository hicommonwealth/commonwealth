import {
  PaginationQueryParams,
  TypedRequestQuery,
  TypedResponse,
  success,
} from '../../types';
import { ServerControllers } from '../../routing/router';
import { AppError } from '../../../../common-common/src/errors';
import { ALL_CHAINS } from '../../middleware/databaseValidationService';
import { SearchCommentsResult } from 'server/controllers/server_comments_methods/search_comments';

const Errors = {
  NoChains: 'No chains resolved to execute search',
};

type SearchCommentsRequestParams = {
  search: string;
  chain?: string;
} & PaginationQueryParams;

type SearchCommentsResponse = SearchCommentsResult;

export const searchCommentsHandler = async (
  controllers: ServerControllers,
  req: TypedRequestQuery<SearchCommentsRequestParams>,
  res: TypedResponse<SearchCommentsResponse>
) => {
  const options = req.query;
  if (!options.chain) {
    throw new AppError(Errors.NoChains);
  }
  if (!req.chain && options.chain !== ALL_CHAINS) {
    // if no chain resolved, ensure that client explicitly requested all chains
    throw new AppError(Errors.NoChains);
  }

  const commentSearchResults = await controllers.comments.searchComments({
    chain: req.chain,
    search: options.search,
    limit: parseInt(options.limit, 10) || 0,
    page: parseInt(options.page, 10) || 0,
    orderBy: options.order_by,
    orderDirection: options.order_direction as any,
  });

  return success(res, commentSearchResults);
};
