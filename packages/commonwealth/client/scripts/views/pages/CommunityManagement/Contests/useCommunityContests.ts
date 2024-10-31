import app from 'state';
import { useGetContestsQuery } from 'state/api/contests';
import { useCommunityStake } from 'views/components/CommunityStake';
import { Contest } from 'views/pages/CommunityManagement/Contests/ContestsList';

const useCommunityContests = () => {
  const { stakeEnabled } = useCommunityStake();

  const { data: contestsData, isLoading: isContestDataLoading } =
    useGetContestsQuery({
      community_id: app.activeChainId() || '',
    });

  // @ts-expect-error StrictNullChecks
  const isContestAvailable = !isContestDataLoading && contestsData?.length > 0;

  const getContestByAddress = (contestAddress: string) => {
    return contestsData?.find(
      (contest) => contest.contest_address === contestAddress,
    );
  };

  return {
    stakeEnabled,
    isContestAvailable,
    contestsData: contestsData as unknown as Contest[],
    isContestDataLoading: isContestDataLoading,
    getContestByAddress,
  };
};

export default useCommunityContests;
