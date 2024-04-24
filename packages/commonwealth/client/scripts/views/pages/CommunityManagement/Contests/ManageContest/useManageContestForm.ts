import { useEffect, useState } from 'react';

import useCommunityContests from 'views/pages/CommunityManagement/Contests/useCommunityContests';
import { ContestFeeType, ContestFormData, ContestRecurringType } from './types';

interface UseManageContestFormProps {
  contestAddress?: string;
}

const useManageContestForm = ({
  contestAddress,
}: UseManageContestFormProps) => {
  const [contestFormData, setContestFormData] =
    useState<ContestFormData | null>(null);

  const { getContestByAddress, isContestDataLoading, stakeEnabled } =
    useCommunityContests();

  // if in edit mode (when contestAddress exists), load specific contest data and
  // use it as a initial state for ManageContest form
  useEffect(() => {
    if (contestAddress && !contestFormData && !isContestDataLoading) {
      const contestData = getContestByAddress(contestAddress);

      if (!contestData) {
        return;
      }

      setContestFormData({
        contestName: contestData.name,
        contestImage: contestData.image_url,
        feeType: contestData.funding_token_address
          ? ContestFeeType.DirectDeposit
          : ContestFeeType.CommunityStake,
        fundingTokenAddress: contestData.funding_token_address,
        contestRecurring:
          contestData.interval === 0
            ? ContestRecurringType.No
            : ContestRecurringType.Yes,
        prizePercentage: contestData.prize_percentage,
        payoutStructure: contestData.payout_structure,
        toggledTopicList: contestData.topics.map((topic) => ({
          name: topic.name,
          id: topic.id,
          checked: true,
        })),
      });
    }
  }, [
    contestAddress,
    contestFormData,
    getContestByAddress,
    isContestDataLoading,
  ]);

  const contestNotFound =
    contestAddress && !isContestDataLoading && !contestFormData;

  return {
    setContestFormData,
    contestFormData,
    isContestDataLoading,
    stakeEnabled,
    contestNotFound,
  };
};

export default useManageContestForm;
