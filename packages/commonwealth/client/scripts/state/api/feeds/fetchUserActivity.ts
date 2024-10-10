import { trpc } from 'client/scripts/utils/trpcClient';

const USER_ACTIVITY_STALE_TIME = 60 * 1_000; // 1 minute
const USER_ACTIVITY_CACHE_TIME = 5 * 60 * 1_000; // 5 minutes

const useFetchUserActivityQuery = ({ apiEnabled }: { apiEnabled: boolean }) => {
  return trpc.feed.getUserActivity.useQuery({
    staleTime: USER_ACTIVITY_STALE_TIME,
    cacheTime: USER_ACTIVITY_CACHE_TIME,
    enabled: apiEnabled,
  });
};

export default useFetchUserActivityQuery;
