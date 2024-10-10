import { trpc } from 'client/scripts/utils/trpcClient';

const USER_ACTIVITY_STALE_TIME = 5 * 60 * 1_000; // 5 minutes (backend caches for 5 minutes as well)
const USER_ACTIVITY_CACHE_TIME = 5 * 60 * 1_000; // 5 minutes

const useFetchGlobalActivityQuery = ({
  apiEnabled,
}: {
  apiEnabled: boolean;
}) => {
  return trpc.feed.getGlobalActivity.useQuery({
    staleTime: USER_ACTIVITY_STALE_TIME,
    cacheTime: USER_ACTIVITY_CACHE_TIME,
    enabled: apiEnabled,
  });
};

export default useFetchGlobalActivityQuery;
