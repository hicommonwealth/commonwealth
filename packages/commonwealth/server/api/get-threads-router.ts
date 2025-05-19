import { AppError, query } from '@hicommonwealth/core';
import { Thread } from '@hicommonwealth/model';
import * as schemas from '@hicommonwealth/schemas';
import { GetThreadsOrderBy, GetThreadsStatus } from '@hicommonwealth/schemas';
import { PaginationQueryParams, success } from 'server/types';
import { formatErrorPretty } from 'server/util/errorFormat';
import { z } from 'zod';

const Errors = {
  InvalidRequest: 'Invalid request',
  NoCommunity: 'No community resolved to execute search',
};

type ActiveThreadsRequestQuery = {
  threads_per_topic: string;
  withXRecentComments?: number;
};

type SearchThreadsRequestQuery = {
  search: string;
  thread_title_only?: string;
  order_by?: 'last_active' | 'rank' | 'created_at' | 'profile_name';
} & PaginationQueryParams;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type GetThreadsResponse = any;

export const get_threads_router = async (req, res) => {
  const queryValidationResult = schemas.DEPRECATED_GetThreads.safeParse(
    req.query,
  );

  if (queryValidationResult.success === false) {
    throw new AppError(formatErrorPretty(queryValidationResult));
  }

  const { bulk, active, search, community_id, include_count } =
    queryValidationResult.data;

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

    const activeThreads = await query(Thread.GetActiveThreads(), {
      actor: { user: { email: '' } },
      payload: {
        community_id,
        threads_per_topic: parseInt(threads_per_topic, 10),
        withXRecentComments,
      },
    });
    return success(res, activeThreads);
  }

  // search for threads
  if (search) {
    const { thread_title_only, limit, page, order_by, order_direction } =
      req.query as SearchThreadsRequestQuery;

    // if (!req.community && community_id !== ALL_COMMUNITIES) {
    //   // if no community resolved, ensure that client explicitly requested all communities
    //   throw new AppError(Errors.NoCommunity);
    // }

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

  throw new AppError(Errors.InvalidRequest);
};
