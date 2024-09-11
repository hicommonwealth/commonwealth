import app from 'state';
import { useGetContestsQuery } from 'state/api/contests';
import { useCommunityStake } from 'views/components/CommunityStake';
import { Contest } from 'views/pages/CommunityManagement/Contests/ContestsList';
import { useFlag } from '../../../../hooks/useFlag';

const useCommunityContests = () => {
  const enabled = useFlag('contest');
  const { stakeEnabled } = useCommunityStake();

  const { data: contestsData, isLoading: isContestDataLoading } =
    useGetContestsQuery({ community_id: app.activeChainId() || '', enabled });

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
    isContestDataLoading: isContestDataLoading && enabled,
    getContestByAddress,
  };
};

export default useCommunityContests;
