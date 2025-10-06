import { trpc } from 'utils/trpcClient';

const FETCH_COMMUNITY_STATS_STALE_TIME = 60 * 60 * 1000;

export function useFetchCommunityStatsQuery(community_id?: string) {
  return trpc.community.getCommunityStats.useQuery(
    { community_id: community_id || '' },
    {
      enabled: !!community_id,
      staleTime: FETCH_COMMUNITY_STATS_STALE_TIME,
    },
  );
}
