import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import axios from 'axios';
import Thread from 'models/Thread';
import moment from 'moment';
import { useEffect, useState } from 'react';
import app from 'state';
import { ApiEndpoints } from 'state/api/config';
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
};

interface CommonProps {
  queryType: typeof QueryTypes[keyof typeof QueryTypes];
  communityId: string;
  apiEnabled?: boolean;
}

interface FetchBulkThreadsProps extends CommonProps {
  queryType: typeof QueryTypes.BULK; // discriminating union
  page: number;
  limit?: number;
  toDate: string;
  fromDate?: string;
  topicId?: number;
  stage?: string;
  includePinnedThreads?: boolean;
  isOnArchivePage?: boolean;
  orderBy?:
    | 'newest'
    | 'oldest'
    | 'mostLikes'
    | 'mostComments'
    | 'latestActivity';
}

interface FetchActiveThreadsProps extends CommonProps {
  queryType: typeof QueryTypes.ACTIVE; // discriminating union
  topicsPerThread?: number;
}

export const featuredFilterQueryMap = {
  newest: 'createdAt:desc',
  oldest: 'createdAt:asc',
  mostLikes: 'numberOfLikes:desc',
  mostComments: 'numberOfComments:desc',
  latestActivity: 'latestActivity:desc',
};

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
        getToAndFromDatesRangesForThreadsTimelines(dateRange);
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
    return [
      ApiEndpoints.FETCH_THREADS,
      props.communityId,
      props.queryType,
      props.topicId,
      props.stage,
      props.includePinnedThreads,
      props.toDate,
      props.fromDate,
      props.limit,
      props.orderBy,
    ];
  }
  if (isFetchActiveThreadsProps(props)) {
    return [
      ApiEndpoints.FETCH_THREADS,
      props.communityId,
      props.queryType,
      props.topicsPerThread,
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
    };
    pageParam: number | undefined;
  }> => {
    const res = await axios.get(
      `${app.serverUrl()}${ApiEndpoints.FETCH_THREADS}`,
      {
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
          orderBy:
            featuredFilterQueryMap[props.orderBy] ||
            featuredFilterQueryMap.newest,
          ...(props.isOnArchivePage && { archived: true }),
        },
      },
    );

    // transform the response
    const transformedData = {
      ...res.data.result,
      threads: res.data.result.threads.map((c) => new Thread(c)),
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
      `${app.serverUrl()}${ApiEndpoints.FETCH_THREADS}`,
      {
        params: {
          active: true,
          community_id: props.communityId,
          threads_per_topic: props.topicsPerThread || 3,
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

    return {
      ...chosenQueryType,
      data: reducedData.threads,
    };
  }

  if (isFetchActiveThreadsProps(props)) return chosenQueryType;
};

export default useFetchThreadsQuery;
export { useDateCursor };
