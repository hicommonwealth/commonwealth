import { useFlag } from 'hooks/useFlag';
import React, { useState } from 'react';
import app from 'state';
import { useTokenMetadataQuery } from 'state/api/tokens';
import useUserStore from 'state/ui/user';
import Permissions from 'utils/Permissions';
import CWCircleMultiplySpinner from 'views/components/component_kit/new_designs/CWCircleMultiplySpinner';
import { PageNotFound } from 'views/pages/404';
import './ManageContest.scss';
import {
  ContestLiveStep,
  DetailsFormStep,
  SignTransactionsStep,
} from './steps';
import { LaunchContestStep } from './types';
import useManageContestForm from './useManageContestForm';

interface ManageContestProps {
  contestAddress?: string;
}

const ManageContest = ({ contestAddress }: ManageContestProps) => {
  const [launchContestStep, setLaunchContestStep] =
    useState<LaunchContestStep>('DetailsForm');
  const [createdContestAddress, setCreatedContestAddress] = useState('');
  const weightedTopicsEnabled = useFlag('weightedTopics');

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

  const chainId = app.chain.meta.ChainNode?.id || 0;
  const { data: tokenMetadata } = useTokenMetadataQuery({
    tokenId: contestFormData?.fundingTokenAddress || '',
    chainId,
    apiEnabled: !!contestFormData?.fundingTokenAddress,
  });

  if (
    !user.isLoggedIn ||
    (weightedTopicsEnabled ? false : !stakeEnabled) ||
    !(Permissions.isSiteAdmin() || Permissions.isCommunityAdmin()) ||
    contestNotFound
  ) {
    return <PageNotFound />;
  }

  const fundingTokenTicker = tokenMetadata?.symbol || 'ETH';

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
            fundingTokenTicker={fundingTokenTicker}
          />
        );

      case 'ContestLive':
        return (
          <ContestLiveStep
            createdContestAddress={createdContestAddress}
            isFarcasterContest={false}
            fundingTokenTicker={fundingTokenTicker}
            fundingTokenAddress={contestFormData?.fundingTokenAddress || ''}
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
