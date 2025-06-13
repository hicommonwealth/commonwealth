import { trpc } from 'utils/trpcClient';

const STATS_STALE_TIME = 60 * 60 * 1000;

const useGetStatsQuery = (community_id?: string) => {
  return trpc.superAdmin.getStats.useQuery(
    {
      community_id,
    },
    {
      staleTime: STATS_STALE_TIME,
      enabled: !!community_id,
    },
  );
};

export default useGetStatsQuery;
