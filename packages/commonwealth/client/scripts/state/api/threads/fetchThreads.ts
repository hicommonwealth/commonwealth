import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import axios from 'axios';
import Thread from 'models/Thread';
import moment from 'moment';
import { useEffect, useState } from 'react';
import { ApiEndpoints, SERVER_URL } from 'state/api/config';
import { ThreadTimelineFilterTypes } from '../../../models/types';
import { cacheTypes } from './helpers/cache';
import { getToAndFromDatesRangesForThreadsTimelines } from './helpers/dates';

const THREADS_STALE_TIME = 180000; // 3 minutes

const QueryTypes = {
  ACTIVE: cacheTypes.ACTIVE_THREADS,
  BULK: cacheTypes.BULK_THREADS,
};

const queryTypeToRQMap = {
  bulk: useInfiniteQuery,
  active: useQuery,
  count: useQuery,
};

interface CommonProps {
  queryType: (typeof QueryTypes)[keyof typeof QueryTypes];
  communityId: string;
  apiEnabled?: boolean;
}

interface FetchBulkThreadsProps extends CommonProps {
  queryType: typeof QueryTypes.BULK; // discriminating union
  page: number;
  limit?: number;
  toDate?: string;
  fromDate?: string;
  topicId?: number;
  stage?: string;
  includePinnedThreads?: boolean;
  includeArchivedThreads?: boolean;
  contestAddress?: string;
  contestStatus?: string;
  orderBy?:
    | 'newest'
    | 'oldest'
    | 'mostLikes'
    | 'mostComments'
    | 'latestActivity';
  withXRecentComments?: number;
}

interface FetchActiveThreadsProps extends CommonProps {
  queryType: typeof QueryTypes.ACTIVE; // discriminating union
  topicsPerThread?: number;
  withXRecentComments?: number;
}

const useDateCursor = ({
  dateRange,
}: {
  dateRange?: ThreadTimelineFilterTypes;
}) => {
  const [dateCursor, setDateCursor] = useState<{
    toDate: string;
    fromDate: string | null;
  }>({ toDate: moment().toISOString(), fromDate: null });

  useEffect(() => {
    const updater = () => {
      const { toDate, fromDate } =
        // @ts-expect-error StrictNullChecks
        getToAndFromDatesRangesForThreadsTimelines(dateRange);
      // @ts-expect-error StrictNullChecks
      setDateCursor({ toDate, fromDate });
    };

    // set date cursor and schedule it to run after some intervals
    updater();
    const interval = setInterval(() => updater(), THREADS_STALE_TIME - 10);

    return () => {
      clearInterval(interval);
    };
  }, [dateRange]);

  return { dateCursor };
};

const isFetchActiveThreadsProps = (props): props is FetchActiveThreadsProps =>
  props.queryType === QueryTypes.ACTIVE;

const isFetchBulkThreadsProps = (props): props is FetchBulkThreadsProps =>
  props.queryType === QueryTypes.BULK;

const getFetchThreadsQueryKey = (props) => {
  if (isFetchBulkThreadsProps(props)) {
    const keys = [
      ApiEndpoints.FETCH_THREADS,
      props.communityId,
      props.queryType,
      props.topicId,
      props.stage,
      props.includePinnedThreads,
      props.fromDate,
      props.limit,
      props.orderBy,
      props.contestAddress,
      props.contestStatus,
      props.withXRecentComments,
    ];

    // remove milliseconds from cache key
    if (props.toDate) {
      const toDate = new Date(props.toDate);
      toDate.setMilliseconds(0);
      keys.push(toDate.toISOString());
    }
    return keys;
  }
  if (isFetchActiveThreadsProps(props)) {
    return [
      ApiEndpoints.FETCH_THREADS,
      props.communityId,
      props.queryType,
      props.topicsPerThread,
      props.withXRecentComments,
    ];
  }
};

const fetchBulkThreads = (props) => {
  return async ({
    pageParam = 1,
  }): Promise<{
    data: {
      numVotingThreads: number;
      limit: number;
      page: number;
      threads: Thread[];
      threadCount: number;
    };
    pageParam: number | undefined;
  }> => {
    const res = await axios.get(`${SERVER_URL}${ApiEndpoints.FETCH_THREADS}`, {
      params: {
        bulk: true,
        page: pageParam,
        limit: props.limit,
        community_id: props.communityId,
        ...(props.topicId && { topic_id: props.topicId }),
        ...(props.stage && { stage: props.stage }),
        ...(props.includePinnedThreads && {
          includePinnedThreads: props.includePinnedThreads || true,
        }),
        ...(props.fromDate && { from_date: props.fromDate }),
        to_date: props.toDate,
        orderBy: props.orderBy || 'newest',
        ...(props.includeArchivedThreads && { archived: true }),
        ...(props.contestAddress && {
          contestAddress: props.contestAddress,
        }),
        ...(props.contestStatus && {
          status: props.contestStatus,
        }),
        ...(props.withXRecentComments && {
          withXRecentComments: props.withXRecentComments,
        }),
      },
    });
    // transform the response
    const transformedData = {
      ...res.data.result,
      threads: res.data.result.threads.map((c) => new Thread(c)),
      threadCount: res.data.result.threadCount,
    };

    return {
      data: transformedData,
      pageParam: transformedData.threads.length > 0 ? pageParam + 1 : undefined,
    };
  };
};

const fetchActiveThreads = (props) => {
  return async (): Promise<Thread[]> => {
    const response = await axios.get(
      `${SERVER_URL}${ApiEndpoints.FETCH_THREADS}`,
      {
        params: {
          active: true,
          community_id: props.communityId,
          threads_per_topic: props.topicsPerThread || 3,
          ...(props.withXRecentComments && {
            withXRecentComments: props.withXRecentComments,
          }),
        },
      },
    );

    // transform response
    return response.data.result.map((c) => new Thread(c));
  };
};

const useFetchThreadsQuery = (
  props: FetchBulkThreadsProps | FetchActiveThreadsProps,
) => {
  const { apiEnabled = true } = props; // destruct to assign default value

  // better to use this in case someone updates this props, we wont reflect those changes
  const [queryType] = useState(props.queryType);

  const chosenQueryType = queryTypeToRQMap[queryType]({
    queryKey: getFetchThreadsQueryKey(props),
    queryFn: (() => {
      if (isFetchBulkThreadsProps(props)) return fetchBulkThreads(props);
      if (isFetchActiveThreadsProps(props)) return fetchActiveThreads(props);
    })(),
    ...(() => {
      if (isFetchBulkThreadsProps(props)) {
        return {
          getNextPageParam: (lastPage) => lastPage.pageParam,
        };
      }
    })(),
    staleTime: THREADS_STALE_TIME,
    keepPreviousData: true,
    enabled: apiEnabled,
  });

  if (isFetchBulkThreadsProps(props)) {
    // transform pages into workable object
    const reducedData = (chosenQueryType?.data?.pages || []).reduce(
      (acc, curr) => ({ threads: [...acc.threads, ...curr.data.threads] }),
      { threads: [] },
    );

    const formattedData = {
      ...chosenQueryType,
      data: reducedData.threads,
      threadCount: chosenQueryType?.data?.pages[0].data.threadCount,
    };
    return formattedData;
  }

  if (isFetchActiveThreadsProps(props)) return chosenQueryType;
};

export default useFetchThreadsQuery;
export { useDateCursor };
