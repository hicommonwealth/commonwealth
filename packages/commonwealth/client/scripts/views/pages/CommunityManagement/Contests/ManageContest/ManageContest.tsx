import { commonProtocol } from '@hicommonwealth/shared';
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

  const user = useUserStore();

  const {
    setContestFormData,
    contestFormData,
    isContestDataLoading,
    contestNotFound,
  } = useManageContestForm({
    contestAddress,
  });

  const nodeEthChainId = app.chain.meta.ChainNode?.eth_chain_id || 0;
  const { data: tokenMetadata } = useTokenMetadataQuery({
    tokenId: contestFormData?.fundingTokenAddress || '',
    nodeEthChainId,
    apiEnabled: !!contestFormData?.fundingTokenAddress,
  });

  if (
    !user.isLoggedIn ||
    !(Permissions.isSiteAdmin() || Permissions.isCommunityAdmin()) ||
    contestNotFound
  ) {
    return <PageNotFound />;
  }

  const fundingTokenTicker =
    tokenMetadata?.symbol || commonProtocol.Denominations.ETH;
  const fundingTokenDecimals =
    tokenMetadata?.decimals || commonProtocol.WeiDecimals.ETH;

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
            fundingTokenDecimals={fundingTokenDecimals}
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
