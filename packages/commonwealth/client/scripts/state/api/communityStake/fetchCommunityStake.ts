import { trpc } from 'utils/trpcClient';

const COMMUNITY_STAKE_STALE_TIME = 3 * 60 * 1_000; // 3 min

interface UseFetchCommunityStakeQueryProps {
  communityId: string;
  stakeId: number;
  apiEnabled: boolean;
}

const useFetchCommunityStakeQuery = ({
  communityId,
  stakeId,
  apiEnabled,
}: UseFetchCommunityStakeQueryProps) => {
  return trpc.community.getCommunityStake.useQuery(
    {
      community_id: communityId,
      stake_id: stakeId,
    },
    {
      staleTime: COMMUNITY_STAKE_STALE_TIME,
      enabled: apiEnabled,
    },
  );
};

export default useFetchCommunityStakeQuery;
