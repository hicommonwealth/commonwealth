import { AppError } from '@hicommonwealth/core';
import { Thread } from '@hicommonwealth/model';
import { ALL_COMMUNITIES } from '../../middleware/databaseValidationService';
import { ServerControllers } from '../../routing/router';
import {
  PaginationQueryParams,
  TypedRequestQuery,
  TypedResponse,
  success,
} from '../../types';
import { formatErrorPretty } from '../../util/errorFormat';

const Errors = {
  UnexpectedError: 'Unexpected error',
  InvalidRequest: 'Invalid request',
  InvalidThreadId: 'Invalid thread ID',
  InvalidCommunityId: 'Invalid community ID',
  NoCommunity: 'No community resolved to execute search',
};

type GetThreadsRequestQuery = {
  community_id: string;
  thread_ids?: string[];
  bulk?: string;
  active?: string;
  search?: string;
};
type ActiveThreadsRequestQuery = {
  threads_per_topic: string;
};
type SearchThreadsRequestQuery = {
  search: string;
  thread_title_only?: string;
} & PaginationQueryParams;
type BulkThreadsRequestQuery = {
  topic_id: string;
  stage?: string;
  includePinnedThreads?: string;
  limit?: string;
  page?: string;
  orderBy?: string;
  from_date?: string;
  to_date?: string;
  archived?: string;
};
type GetThreadsResponse = any;

export const getThreadsHandler = async (
  controllers: ServerControllers,
  req: TypedRequestQuery<
    GetThreadsRequestQuery &
      (
        | ActiveThreadsRequestQuery
        | SearchThreadsRequestQuery
        | BulkThreadsRequestQuery
      )
  >,
  res: TypedResponse<GetThreadsResponse>,
) => {
  const queryValidationResult = Thread.GetThreadsParamsSchema.safeParse(
    req.query,
  );

  if (queryValidationResult.success === false) {
    throw new AppError(formatErrorPretty(queryValidationResult));
  }

  const { thread_ids, bulk, active, search, community_id } =
    queryValidationResult.data;

  // get threads by IDs
  if (thread_ids) {
    const threadIds = thread_ids.map((id) => parseInt(id, 10));
    for (const id of threadIds) {
      if (isNaN(id)) {
        throw new AppError(Errors.InvalidThreadId);
      }
    }
    const threads = await controllers.threads.getThreadsByIds({ threadIds });
    return success(res, threads);
  }

  // get bulk threads
  if (bulk) {
    const bulkQueryValidationResult =
      Thread.GetBulkThreadsParamsSchema.safeParse(req.query);

    if (bulkQueryValidationResult.success === false) {
      throw new AppError(formatErrorPretty(bulkQueryValidationResult));
    }

    const {
      stage,
      topic_id,
      includePinnedThreads,
      limit,
      page,
      orderBy,
      from_date,
      to_date,
      archived,
    } = bulkQueryValidationResult.data;

    const bulkThreads = await controllers.threads.getBulkThreads({
      communityId: community_id,
      stage,
      topicId: topic_id,
      includePinnedThreads,
      page,
      limit,
      orderBy,
      fromDate: from_date,
      toDate: to_date,
      archived: archived,
    });
    return success(res, bulkThreads);
  }

  // get active threads
  if (active) {
    const { threads_per_topic } = req.query as ActiveThreadsRequestQuery;

    const activeThreads = await controllers.threads.getActiveThreads({
      communityId: community_id,
      threadsPerTopic: parseInt(threads_per_topic, 10),
    });
    return success(res, activeThreads);
  }

  // search for threads
  if (search) {
    const { thread_title_only, limit, page, order_by, order_direction } =
      req.query as SearchThreadsRequestQuery;

    if (!req.community && community_id !== ALL_COMMUNITIES) {
      // if no community resolved, ensure that client explicitly requested all communities
      throw new AppError(Errors.NoCommunity);
    }

    const searchResults = await controllers.threads.searchThreads({
      communityId: community_id,
      searchTerm: search,
      threadTitleOnly: thread_title_only === 'true',
      limit: parseInt(limit, 10) || 0,
      page: parseInt(page, 10) || 0,
      orderBy: order_by,
      orderDirection: order_direction as any,
    });
    return success(res, searchResults);
  }

  throw new AppError(Errors.InvalidRequest);
};
