import React, { useState } from 'react';

import app from 'state';
import Permissions from 'utils/Permissions';
import CWCircleMultiplySpinner from 'views/components/component_kit/new_designs/CWCircleMultiplySpinner';
import { PageNotFound } from 'views/pages/404';

import {
  ContestLiveStep,
  DetailsFormStep,
  SignTransactionsStep,
} from './steps';
import { LaunchContestStep } from './types';
import useManageContestForm from './useManageContestForm';

import './ManageContest.scss';

interface ManageContestProps {
  contestAddress?: string;
}

const ManageContest = ({ contestAddress }: ManageContestProps) => {
  const [launchContestStep, setLaunchContestStep] =
    useState<LaunchContestStep>('DetailsForm');

  const {
    setContestFormData,
    contestFormData,
    isContestDataLoading,
    stakeEnabled,
    contestNotFound,
  } = useManageContestForm({
    contestAddress,
  });

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
