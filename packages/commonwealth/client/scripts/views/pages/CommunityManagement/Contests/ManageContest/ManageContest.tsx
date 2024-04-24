import React, { useState } from 'react';

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
import { ContestFormData, LaunchContestStep } from './types';

import './ManageContest.scss';

interface ManageContestProps {
  contestAddress?: string;
}

const ManageContest = ({ contestAddress }: ManageContestProps) => {
  const [contestFormData, setContestFormData] = useState<ContestFormData>({});
  const [launchContestStep, setLaunchContestStep] =
    useState<LaunchContestStep>('DetailsForm');

  const { getContestByAddress, stakeEnabled, isContestDataLoading } =
    useCommunityContests();

  // useEffect(() => {
  //   if (contestAddress) {
  // const contestData = getContestByAddress(contestAddress);
  // setContestFormData({
  //   contestName: contestData.name,
  //   contestImage: contestData.imageUrl,
  //   feeType: contestData.feeType,
  //   fundingTokenAddress: contestData.fundingTokenAddress,
  //   contestRecurring: contestData.contestRecurring,
  //   prizePercentage: contestData.prizePercentage,
  //   payoutStructure: contestData.payoutStructure,
  //   toggledTopicList: contestData.toggledTopicList,
  // });
  // }
  // }, [contestAddress, getContestByAddress]);

  if (
    !app.isLoggedIn() ||
    !stakeEnabled ||
    !(Permissions.isSiteAdmin() || Permissions.isCommunityAdmin())
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

  return (
    <div className="ManageContest">
      {isContestDataLoading ? <CWCircleMultiplySpinner /> : getCurrentStep()}
    </div>
  );
};

export default ManageContest;
