import { AppError } from '@hicommonwealth/adapters';
import { ALL_COMMUNITIES } from '../../middleware/databaseValidationService';
import { ServerControllers } from '../../routing/router';
import {
  PaginationQueryParams,
  TypedRequestQuery,
  TypedResponse,
  success,
} from '../../types';

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
  const { community } = req;
  const { thread_ids, bulk, active, search, community_id } = req.query;

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
    } = req.query as BulkThreadsRequestQuery;

    const bulkThreads = await controllers.threads.getBulkThreads({
      community,
      stage,
      topicId: parseInt(topic_id, 10),
      includePinnedThreads: includePinnedThreads === 'true',
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      orderBy,
      fromDate: from_date,
      toDate: to_date,
      archived: archived === 'true',
    });
    return success(res, bulkThreads);
  }

  // get active threads
  if (active) {
    const { threads_per_topic } = req.query as ActiveThreadsRequestQuery;

    const activeThreads = await controllers.threads.getActiveThreads({
      community,
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
      community,
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
