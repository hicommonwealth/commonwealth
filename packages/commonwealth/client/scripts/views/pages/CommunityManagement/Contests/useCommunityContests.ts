import { useCommunityStake } from 'views/components/CommunityStake';

import app from 'state';
import { trpc } from 'utils/trpcClient';

const useCommunityContests = () => {
  const { stakeEnabled } = useCommunityStake();

  const { data: contestsData, isLoading: isContestDataLoading } =
    trpc.contest.getAllContests.useQuery(
      {
        community_id: app.activeChainId(),
      },
      { enabled: !!app.activeChainId() },
    );

  const isContestAvailable = !isContestDataLoading && contestsData?.length > 0;

  const getContestByAddress = (contestAddress: string) => {
    return contestsData?.find(
      (contest) => contest.contest_address === contestAddress,
    );
  };

  return {
    stakeEnabled,
    isContestAvailable,
    contestsData,
    isContestDataLoading,
    getContestByAddress,
  };
};

export default useCommunityContests;
