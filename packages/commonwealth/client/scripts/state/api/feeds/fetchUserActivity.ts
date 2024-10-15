import { trpc } from 'client/scripts/utils/trpcClient';

const USER_ACTIVITY_STALE_TIME = 60 * 1_000; // 1 minute
const USER_ACTIVITY_CACHE_TIME = 5 * 60 * 1_000; // 5 minutes
const GLOBAL_ACTIVITY_STALE_TIME = 5 * 60 * 1_000; // 5 minutes (backend caches for 5 minutes as well)

export const useFetchGlobalActivityQuery = () => {
  return trpc.feed.getGlobalActivity.useQuery(
    {
      thread_limit: 50,
      comment_limit: 3,
    },
    {
      staleTime: GLOBAL_ACTIVITY_STALE_TIME,
      cacheTime: USER_ACTIVITY_CACHE_TIME,
    },
  );
};

export const useFetchUserActivityQuery = () => {
  return trpc.feed.getUserActivity.useQuery(
    {
      thread_limit: 50,
      comment_limit: 3,
    },
    {
      staleTime: USER_ACTIVITY_STALE_TIME,
      cacheTime: USER_ACTIVITY_CACHE_TIME,
    },
  );
};
