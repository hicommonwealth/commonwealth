import { useInfiniteQuery } from '@tanstack/react-query';
import axios from 'axios';
import moment from 'moment';
import { useEffect, useState } from 'react';
import app from 'state';
import { ApiEndpoints } from 'state/api/config';
import {
  ThreadTimelineFilterTypes
} from '../../../models/types';

const THREADS_STALE_TIME = 100 * 1_000; // 30 s todo: UNDO THIS

interface CommonProps {
  queryType: 'active' | 'bulk',
  chainId: string;
}

interface FetchThreadsProps extends CommonProps {
  page: number;
  limit?: number;
  toDate: string;
  fromDate?: string;
  topicId?: number;
  stage?: string;
  includePinnedThreads?: boolean;
  orderBy?: 'newest' | 'oldest' | 'mostLikes' | 'mostComments'
}

const featuredFilterQueryMap = {
  newest: 'createdAt:desc',
  oldest: 'createdAt:asc',
  mostLikes: 'numberOfLikes:desc',
  mostComments: 'numberOfComments:desc',
};

const fetchThreads = async ({
  page,
  limit = 20,
  chainId,
  toDate,
  fromDate,
  topicId,
  stage,
  includePinnedThreads,
  orderBy,
}: FetchThreadsProps) => {
  const response = await axios.get(
    `${app.serverUrl()}${ApiEndpoints.FETCH_THREADS}`,
    {
      params: {
        bulk: true,
        page,
        limit,
        chain: chainId,
        ...(topicId && { topic_id: topicId }),
        ...(stage && { stage: stage }),
        ...(includePinnedThreads && { includePinnedThreads: true }),
        ...(fromDate && { from_date: fromDate }),
        to_date: toDate,
        orderBy:
          featuredFilterQueryMap[orderBy] ||
          featuredFilterQueryMap.newest,
      },
    }
  );

  // transform response
  return {
    ...response.data.result,
    threads: response.data.result.threads.map((c) => app.threads.modelFromServer(c))
  };
};

const useDateCursor = ({ dateRange }: { dateRange?: ThreadTimelineFilterTypes }) => {
  const [dateCursor, setDateCursor] = useState<{
    toDate: string,
    fromDate: string | null
  }>({ toDate: moment().toISOString(), fromDate: null })

  useEffect(() => {
    const today = moment();

    const interval = setInterval(() => {
      const fromDate = (() => {
        if (dateRange) {
          if (
            [
              ThreadTimelineFilterTypes.ThisMonth,
              ThreadTimelineFilterTypes.ThisWeek,
            ].includes(dateRange)
          ) {
            return today
              .startOf(dateRange.toLowerCase().replace('this', '') as any)
              .toISOString();
          }

          if (dateRange.toLowerCase() === ThreadTimelineFilterTypes.AllTime) {
            return new Date(0).toISOString();
          }
        }

        return null;
      })();
      const toDate = (() => {
        if (dateRange) {
          if (
            [
              ThreadTimelineFilterTypes.ThisMonth,
              ThreadTimelineFilterTypes.ThisWeek,
            ].includes(dateRange)
          ) {
            return today
              .endOf(dateRange.toLowerCase().replace('this', '') as any)
              .toISOString();
          }

          if (dateRange.toLowerCase() === ThreadTimelineFilterTypes.AllTime) {
            return moment().toISOString();
          }
        }

        return moment().toISOString();
      })();
      setDateCursor({ toDate, fromDate })
    }, THREADS_STALE_TIME)

    return (() => {
      clearInterval(interval)
    })
  }, [dateRange])

  return { dateCursor }
}

const useFetchThreadsQuery = ({
  chainId,
  queryType,
  toDate,
  fromDate,
  includePinnedThreads = true,
  limit,
  orderBy,
  stage,
  topicId
}: FetchThreadsProps) => {
  const infiniteQuery = useInfiniteQuery({
    enabled: queryType === 'bulk',
    queryKey: [
      ApiEndpoints.FETCH_THREADS,
      chainId,
      queryType,
      topicId,
      stage,
      includePinnedThreads,
      toDate,
      fromDate,
      limit,
      orderBy
    ],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await fetchThreads({
        chainId,
        queryType,
        page: pageParam,
        toDate,
        fromDate,
        includePinnedThreads,
        limit,
        orderBy,
        stage,
        topicId
      })

      // todo clean this up
      await Promise.all([
        app.threads.fetchReactionsCount(res.threads),
        app.threadUniqueAddressesCount.fetchThreadsUniqueAddresses({
          threads: res.threads,
          chain: chainId,
        }),
      ]);

      return { data: res, pageParam: res.threads.length > 0 ? pageParam + 1 : undefined }
    },
    getNextPageParam: (lastPage, pages) => lastPage.pageParam,
    staleTime: THREADS_STALE_TIME,
  });

  // transform pages into workable object
  const reducedData = (infiniteQuery?.data?.pages || []).reduce(
    (acc, curr) => ({ threads: [...acc.threads, ...curr.data.threads] }),
    { threads: [] }
  );

  return {
    ...infiniteQuery,
    data: reducedData.threads
  }
};

export default useFetchThreadsQuery;
export { useDateCursor };
