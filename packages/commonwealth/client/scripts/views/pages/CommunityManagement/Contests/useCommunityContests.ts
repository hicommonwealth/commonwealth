import { useQuery } from '@tanstack/react-query';

import { useCommunityStake } from 'views/components/CommunityStake';

import mockedContests from './mockedContests';

const useCommunityContests = () => {
  const { stakeEnabled } = useCommunityStake();

  const { data: contestsData, isLoading: isContestDataLoading } = useQuery<
    typeof mockedContests
  >({
    queryKey: ['contests'],
    queryFn: () => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(mockedContests);
        }, 2000);
      });
    },
  });

  const isContestAvailable = !isContestDataLoading && contestsData?.length > 0;

  return {
    stakeEnabled,
    isContestAvailable,
    contestsData,
    isContestDataLoading,
  };
};

export default useCommunityContests;
