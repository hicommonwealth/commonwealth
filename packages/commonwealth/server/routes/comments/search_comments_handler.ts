import { TypedRequestQuery, TypedResponse, success } from '../../types';
import { ServerControllers } from '../../routing/router';
import { AppError } from '../../../../common-common/src/errors';
import { ALL_CHAINS } from '../../middleware/databaseValidationService';
import { SearchCommentsResult } from 'server/controllers/server_comments_methods/search_comments';

export const MIN_COMMENT_SEARCH_QUERY_LENGTH = 4;

const Errors = {
  UnexpectedError: 'Unexpected error',
  QueryMissing: 'Must enter query to begin searching',
  QueryTooShort: 'Query must be at least 4 characters',
  NoCommunity: 'Title search must be community scoped',
  NoChains: 'No chains resolved to execute search',
};

type SearchCommentsRequestParams = {
  search: string;
  chain?: string;
  sort?: string;
  page?: string;
  page_size?: string;
};
type SearchCommentsResponse = SearchCommentsResult;

export const searchCommentsHandler = async (
  controllers: ServerControllers,
  req: TypedRequestQuery<SearchCommentsRequestParams>,
  res: TypedResponse<SearchCommentsResponse>
) => {
  const options = req.query;
  if (!options.search) {
    throw new AppError(Errors.QueryMissing);
  }
  if (options.search.length < MIN_COMMENT_SEARCH_QUERY_LENGTH) {
    throw new AppError(Errors.QueryTooShort);
  }
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
    sort: options.sort,
    page: parseInt(options.page, 10) || 0,
    pageSize: parseInt(options.page_size, 10) || 0,
  });

  return success(res, commentSearchResults);
};
