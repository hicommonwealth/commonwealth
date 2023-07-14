import { TypedRequestQuery, TypedResponse, success } from '../../types';
import { ServerControllers } from '../../routing/router';
import { AppError } from '../../../../common-common/src/errors';
import { ALL_CHAINS } from '../../middleware/databaseValidationService';

const MIN_SEARCH_QUERY_LENGTH = 4;

const Errors = {
  UnexpectedError: 'Unexpected error',
  InvalidRequest: 'Invalid request',
  InvalidThreadId: 'Invalid thread ID',
  QueryMissing: 'Must enter query to begin searching',
  QueryTooShort: 'Query must be at least 4 characters',
  NoChains: 'No chains resolved to execute search',
};

type GetThreadsRequestQuery = {
  chain: string;
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
  limit?: string;
  page?: string;
  order_by?: string;
  order_direction?: string;
};
type BulkThreadsRequestQuery = {
  topic_id: string;
  stage?: string;
  includePinnedThreads?: string;
  limit?: string;
  page?: string;
  orderBy?: string;
  from_date?: string;
  to_date?: string;
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
  res: TypedResponse<GetThreadsResponse>
) => {
  const { chain } = req;
  const { thread_ids, bulk, active, search } = req.query;

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
    } = req.query as BulkThreadsRequestQuery;

    const bulkThreads = await controllers.threads.getBulkThreads({
      chain,
      stage,
      topicId: parseInt(topic_id, 10),
      includePinnedThreads: includePinnedThreads === 'true',
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      orderBy,
      fromDate: from_date,
      toDate: to_date,
    });
    return success(res, bulkThreads);
  }

  // get active threads
  if (active) {
    const { threads_per_topic } = req.query as ActiveThreadsRequestQuery;

    const activeThreads = await controllers.threads.getActiveThreads({
      chain,
      threadsPerTopic: parseInt(threads_per_topic, 10),
    });
    return success(res, activeThreads);
  }

  // search for threads
  if (search) {
    const { thread_title_only, limit, page, order_by, order_direction } =
      req.query as SearchThreadsRequestQuery;
    if (!search) {
      throw new AppError(Errors.QueryMissing);
    }
    if (search.length < MIN_SEARCH_QUERY_LENGTH) {
      throw new AppError(Errors.QueryTooShort);
    }
    if (!req.chain && req.query.chain !== ALL_CHAINS) {
      // if no chain resolved, ensure that client explicitly requested all chains
      throw new AppError(Errors.NoChains);
    }

    const searchResults = await controllers.threads.searchThreads({
      chain,
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
