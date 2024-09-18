import React, { useState } from 'react';

import useUserStore from 'state/ui/user';
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
  const [createdContestAddress, setCreatedContestAddress] = useState('');

  const user = useUserStore();

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
    !user.isLoggedIn ||
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
            // @ts-expect-error <StrictNullChecks/>
            contestFormData={contestFormData}
            onSetContestFormData={setContestFormData}
          />
        );

      case 'SignTransactions':
        return (
          <SignTransactionsStep
            onSetLaunchContestStep={setLaunchContestStep}
            // @ts-expect-error <StrictNullChecks/>
            contestFormData={contestFormData}
            onSetCreatedContestAddress={setCreatedContestAddress}
          />
        );

      case 'ContestLive':
        return (
          <ContestLiveStep
            createdContestAddress={createdContestAddress}
            isFarcasterContest={!!contestFormData?.farcasterContestDuration}
          />
        );
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
