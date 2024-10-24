import { useEffect, useState } from 'react';

import moment from 'moment';
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
  // use it as a initial state for DetailsFormStep
  useEffect(() => {
    if (contestAddress && !contestFormData && !isContestDataLoading) {
      const contestData = getContestByAddress(contestAddress);

      if (!contestData) {
        return;
      }

      const contestLengthInSeconds = moment(
        contestData?.contests?.[0]?.end_time,
      ).diff(contestData?.contests?.[0]?.start_time, 'seconds');

      setContestFormData({
        contestName: contestData.name,
        contestImage: contestData.image_url!,
        contestTopic: {
          value: contestData.topics[0]?.id,
          label: contestData.topics[0]?.name,
        },
        contestDuration:
          contestData.interval === 0
            ? contestLengthInSeconds
            : contestData.interval,
        feeType: contestData.funding_token_address
          ? ContestFeeType.DirectDeposit
          : ContestFeeType.CommunityStake,
        fundingTokenAddress: contestData.funding_token_address,
        contestRecurring:
          contestData.interval === 0
            ? ContestRecurringType.No
            : ContestRecurringType.Yes,
        // @ts-expect-error StrictNullChecks
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
