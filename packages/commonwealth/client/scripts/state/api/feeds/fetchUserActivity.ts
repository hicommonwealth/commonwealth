import { trpc } from 'client/scripts/utils/trpcClient';

const USER_ACTIVITY_STALE_TIME = 60 * 1_000; // 1 minute
const USER_ACTIVITY_CACHE_TIME = 5 * 60 * 1_000; // 5 minutes
const GLOBAL_ACTIVITY_STALE_TIME = 5 * 60 * 1_000; // 5 minutes (backend caches for 5 minutes as well)

export const useFetchGlobalActivityQuery = ({ limit }) => {
  return trpc.feed.getGlobalActivity.useInfiniteQuery(
    {
      limit,
    },
    {
      staleTime: GLOBAL_ACTIVITY_STALE_TIME,
      cacheTime: USER_ACTIVITY_CACHE_TIME,
      initialCursor: 1,
      getNextPageParam: (lastPage) => {
        console.log({ lastPage });
        const nextPageNum = lastPage.page + 1;
        if (nextPageNum <= lastPage.totalPages) return nextPageNum;
        return undefined;
      },
    },
  );
};

export const useFetchUserActivityQuery = ({ limit }) => {
  return trpc.feed.getUserActivity.useInfiniteQuery(
    {
      limit,
      comment_limit: 3,
    },
    {
      staleTime: USER_ACTIVITY_STALE_TIME,
      cacheTime: USER_ACTIVITY_CACHE_TIME,
      initialCursor: 1,
      getNextPageParam: (lastPage) => {
        const nextPageNum = lastPage.page + 1;
        if (nextPageNum <= lastPage.totalPages) return nextPageNum;
        return undefined;
      },
    },
  );
};
