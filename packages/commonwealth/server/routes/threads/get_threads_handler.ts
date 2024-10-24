import { AppError, query } from '@hicommonwealth/core';
import { Thread } from '@hicommonwealth/model';
import * as schemas from '@hicommonwealth/schemas';
import { GetThreadsOrderBy, GetThreadsStatus } from '@hicommonwealth/schemas';
import { z } from 'zod';
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

export type GetThreadsRequestQuery = {
  community_id: string;
  thread_ids?: string[];
  bulk?: string;
  active?: string;
  search?: string;
  count?: boolean;
};
export type ActiveThreadsRequestQuery = {
  threads_per_topic: string;
  withXRecentComments?: number;
};
export type SearchThreadsRequestQuery = {
  search: string;
  thread_title_only?: string;
  order_by?: 'last_active' | 'rank' | 'created_at' | 'profile_name';
} & PaginationQueryParams;
export type BulkThreadsRequestQuery = {
  topic_id: string;
  stage?: string;
  includePinnedThreads?: string;
  limit?: string;
  page?: string;
  orderBy?: string;
  from_date?: string;
  to_date?: string;
  archived?: string;
  withXRecentComments?: number;
};
export type CountThreadsRequestQuery = {
  limit?: number;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type GetThreadsResponse = any;

export const getThreadsHandler = async (
  controllers: ServerControllers,
  req: TypedRequestQuery<
    GetThreadsRequestQuery &
      (
        | ActiveThreadsRequestQuery
        | SearchThreadsRequestQuery
        | BulkThreadsRequestQuery
        | CountThreadsRequestQuery
      )
  >,
  res: TypedResponse<GetThreadsResponse>,
) => {
  const queryValidationResult = schemas.DEPRECATED_GetThreads.safeParse(
    req.query,
  );

  if (queryValidationResult.success === false) {
    throw new AppError(formatErrorPretty(queryValidationResult));
  }

  const {
    thread_ids,
    bulk,
    active,
    search,
    count,
    community_id,
    include_count,
  } = queryValidationResult.data;

  // get threads by IDs
  if (thread_ids) {
    const threads = await controllers.threads.getThreadsByIds({
      threadIds: thread_ids,
    });
    return success(res, threads);
  }

  // get bulk threads
  if (bulk) {
    const bulkQueryValidationResult =
      schemas.DEPRECATED_GetBulkThreads.safeParse(req.query);

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
      contestAddress,
      status,
      withXRecentComments,
    } = bulkQueryValidationResult.data;

    const bulkThreads = await query(Thread.GetThreads(), {
      actor: {
        user: { email: '' },
      },
      payload: {
        page,
        limit,
        community_id,
        stage,
        topic_id,
        includePinnedThreads,
        order_by: orderBy as z.infer<typeof GetThreadsOrderBy>,
        from_date,
        to_date,
        archived: archived,
        contestAddress,
        status: status as z.infer<typeof GetThreadsStatus>,
        withXRecentComments,
      },
    });
    return success(res, bulkThreads);
  }

  // get active threads
  if (active) {
    const { threads_per_topic, withXRecentComments } =
      req.query as ActiveThreadsRequestQuery;

    const activeThreads = await controllers.threads.getActiveThreads({
      communityId: community_id,
      threadsPerTopic: parseInt(threads_per_topic, 10),
      withXRecentComments,
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

    const searchResults = await query(Thread.SearchThreads(), {
      actor: { user: { email: '' } },
      payload: {
        communityId: community_id,
        searchTerm: search,
        threadTitleOnly: thread_title_only === 'true',
        limit: parseInt(limit!, 10) || 0,
        page: parseInt(page!, 10) || 0,
        orderBy: order_by,
        orderDirection: order_direction,
        includeCount: include_count,
      },
    });
    return success(res, searchResults);
  }

  // count threads
  if (count) {
    const { limit } = req.query as CountThreadsRequestQuery;
    const countResult = await controllers.threads.countThreads({
      communityId: community_id,
      limit,
    });
    return success(res, { count: countResult });
  }

  throw new AppError(Errors.InvalidRequest);
};
