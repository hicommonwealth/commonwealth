import React, { useEffect, useState } from 'react';

import app from 'state';
import Permissions from 'utils/Permissions';
import CWCircleMultiplySpinner from 'views/components/component_kit/new_designs/CWCircleMultiplySpinner';
import { PageNotFound } from 'views/pages/404';

import useCommunityContests from '../useCommunityContests';
import {
  ContestLiveStep,
  DetailsFormStep,
  SignTransactionsStep,
} from './steps';
import {
  ContestFeeType,
  ContestFormData,
  ContestRecurringType,
  LaunchContestStep,
} from './types';

import './ManageContest.scss';

interface ManageContestProps {
  contestAddress?: string;
}

const ManageContest = ({ contestAddress }: ManageContestProps) => {
  const [contestFormData, setContestFormData] =
    useState<ContestFormData | null>(null);
  const [launchContestStep, setLaunchContestStep] =
    useState<LaunchContestStep>('DetailsForm');

  const { getContestByAddress, stakeEnabled, isContestDataLoading } =
    useCommunityContests();

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

  if (
    !app.isLoggedIn() ||
    !stakeEnabled ||
    !(Permissions.isSiteAdmin() || Permissions.isCommunityAdmin()) ||
    contestNotFound
  ) {
    return <PageNotFound />;
  }

  const getCurrentStep = () => {
    switch (launchContestStep) {
      case 'DetailsForm':
        return (
          <DetailsFormStep
            contestAddress={contestAddress}
            onSetLaunchContestStep={setLaunchContestStep}
            contestFormData={contestFormData}
            onSetContestFormData={setContestFormData}
          />
        );

      case 'SignTransactions':
        return (
          <SignTransactionsStep
            onSetLaunchContestStep={setLaunchContestStep}
            isDirectDepositSelected={false}
          />
        );

      case 'ContestLive':
        return <ContestLiveStep />;
    }
  };

  const shouldDetailsFormStepLoading =
    launchContestStep === 'DetailsForm' && contestAddress && !contestFormData;
  const isLoading = shouldDetailsFormStepLoading || isContestDataLoading;

  return (
    <div className="ManageContest">
      {isLoading ? <CWCircleMultiplySpinner /> : getCurrentStep()}
    </div>
  );
};

export default ManageContest;
