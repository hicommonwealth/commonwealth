import { trpc } from 'client/scripts/utils/trpcClient';

const USER_ACTIVITY_STALE_TIME = 60 * 1_000; // 1 minute
const USER_ACTIVITY_CACHE_TIME = 5 * 60 * 1_000; // 5 minutes
const GLOBAL_ACTIVITY_STALE_TIME = 5 * 60 * 1_000; // 5 minutes (backend caches for 5 minutes as well)

export const useFetchGlobalActivityQuery = ({
  limit,
  community_id,
  search,
  apiEnabled = true,
}: {
  limit: number;
  community_id?: string;
  search?: string;
  apiEnabled?: boolean;
}) => {
  return trpc.feed.getGlobalActivity.useInfiniteQuery(
    {
      limit,
      community_id,
      search,
    },
    {
      staleTime: GLOBAL_ACTIVITY_STALE_TIME,
      gcTime: USER_ACTIVITY_CACHE_TIME,
      initialCursor: 1,
      enabled: apiEnabled,
      getNextPageParam: (lastPage) => {
        if (lastPage.results.length === 0) return undefined;
        return lastPage.page + 1;
      },
    },
  );
};

export const useFetchUserActivityQuery = ({
  limit,
  apiEnabled,
}: {
  limit: number;
  apiEnabled?: boolean;
}) => {
  return trpc.feed.getUserActivity.useInfiniteQuery(
    {
      limit,
      comment_limit: 3,
    },
    {
      staleTime: USER_ACTIVITY_STALE_TIME,
      gcTime: USER_ACTIVITY_CACHE_TIME,
      initialCursor: 1,
      enabled: apiEnabled,
      getNextPageParam: (lastPage) => {
        const nextPageNum = lastPage.page + 1;
        if (nextPageNum <= lastPage.totalPages) return nextPageNum;
        return undefined;
      },
    },
  );
};
