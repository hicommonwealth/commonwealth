import { AppError } from '@hicommonwealth/core';
import { SearchCommentsResult } from 'server/controllers/server_comments_methods/search_comments';
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
};

type SearchCommentsRequestQuery = {
  search: string;
  community_id?: string;
  include_count?: boolean;
} & PaginationQueryParams;

type SearchCommentsResponse = SearchCommentsResult;

export const searchCommentsHandler = async (
  controllers: ServerControllers,
  req: TypedRequestQuery<SearchCommentsRequestQuery>,
  res: TypedResponse<SearchCommentsResponse>,
) => {
  const options = req.query;
  if (!req.community && options.community_id !== ALL_COMMUNITIES) {
    // if no community resolved, ensure that client explicitly requested all communities
    throw new AppError(Errors.NoCommunity);
  }

  const commentSearchResults = await controllers.comments.searchComments({
    // @ts-expect-error StrictNullChecks
    community: req.community,
    search: options.search,
    // @ts-expect-error StrictNullChecks
    limit: parseInt(options.limit, 10) || 0,
    // @ts-expect-error StrictNullChecks
    page: parseInt(options.page, 10) || 0,
    orderBy: options.order_by,
    orderDirection: options.order_direction as any,
    includeCount: options.include_count,
  });

  return success(res, commentSearchResults);
};
