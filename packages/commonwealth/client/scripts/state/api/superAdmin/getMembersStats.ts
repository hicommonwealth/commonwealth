import { notifyError } from 'client/scripts/controllers/app/notifications';
import { trpc } from 'utils/trpcClient';

const STATS_STALE_TIME = 60 * 60 * 1000;

const useGetMembersStatsQuery = ({ communityId }: { communityId?: string }) => {
  return trpc.superAdmin.getCommunityMembersStats.useQuery(
    {
      community_id: communityId,
    },
    {
      staleTime: STATS_STALE_TIME,
      enabled: !!communityId,
      onError: (error) => {
        notifyError(`Error fetching stats: ${error.message}`);
      },
    },
  );
};

export default useGetMembersStatsQuery;
