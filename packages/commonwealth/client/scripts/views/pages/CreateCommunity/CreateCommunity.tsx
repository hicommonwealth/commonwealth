import React from 'react';

import CWFormSteps from 'views/components/component_kit/new_designs/CWFormSteps';

import { MixpanelCommunityCreationEvent } from '../../../../../shared/analytics/types';
import { useBrowserAnalyticsTrack } from '../../../hooks/useBrowserAnalyticsTrack';
import CommunityOnchainTransactions from './steps/CommunityOnchainTransactions';
import { TransactionType } from './steps/CommunityOnchainTransactions/helpers/transactionUtils';
import CommunityTypeStep from './steps/CommunityTypeStep';
import SuccessStep from './steps/SuccessStep';
import useCreateCommunity from './useCreateCommunity';
import { CreateCommunityStep, getFormSteps } from './utils';

import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import useAppStatus from '../../../hooks/useAppStatus';
import './CreateCommunity.scss';
import CommunityInformationStep from './steps/CommunityInformationStep';

const CreateCommunity = () => {
  const {
    createCommunityStep,
    selectedCommunity,
    setSelectedCommunity,
    selectedAddress,
    setSelectedAddress,
    setSelectedChainId,
    createdCommunityId,
    createdCommunityName,
    handleCompleteCommunityInformationStep,
    onChangeStep,
    showOnchainTransactionsStep,
    selectedChainId,
  } = useCreateCommunity();

  const { isAddedToHomeScreen } = useAppStatus();

  useBrowserAnalyticsTrack({
    payload: {
      event: MixpanelCommunityCreationEvent.CREATE_COMMUNITY_VISITED,
      isPWA: isAddedToHomeScreen,
    },
  });

  const isSuccessStep = createCommunityStep === CreateCommunityStep.Success;

  const goToSuccessStep = () => {
    onChangeStep(true);
  };

  const getCurrentStep = () => {
    switch (createCommunityStep) {
      case CreateCommunityStep.CommunityTypeSelection:
        return (
          <CommunityTypeStep
            selectedCommunity={selectedCommunity}
            setSelectedCommunity={setSelectedCommunity}
            setSelectedAddress={setSelectedAddress}
            handleContinue={() => onChangeStep(true)}
          />
        );

      case CreateCommunityStep.CommunityInformation:
        return (
          <CommunityInformationStep
            selectedCommunity={selectedCommunity}
            handleSelectedChainId={setSelectedChainId}
            handleGoBack={() => onChangeStep(false)}
            handleContinue={handleCompleteCommunityInformationStep}
          />
        );

      case CreateCommunityStep.OnchainTransactions:
        return (
          <CommunityOnchainTransactions
            createdCommunityName={createdCommunityName}
            createdCommunityId={createdCommunityId}
            selectedAddress={selectedAddress}
            chainId={selectedChainId || ''}
            transactionTypes={[
              TransactionType.DeployNamespace,
              TransactionType.ConfigureNominations,
              TransactionType.MintVerificationToken,
            ]}
            onEnableStakeStepCancel={goToSuccessStep}
            onSignTransactionsStepReserveNamespaceSuccess={goToSuccessStep}
            onSignTransactionsStepCancel={goToSuccessStep}
          />
        );

      case CreateCommunityStep.Success:
        return <SuccessStep communityId={createdCommunityId} />;
    }
  };

  return (
    <CWPageLayout>
      <div className="CreateCommunity">
        {!isSuccessStep && (
          <CWFormSteps
            steps={getFormSteps(
              createCommunityStep,
              showOnchainTransactionsStep,
            )}
          />
        )}

        {getCurrentStep()}
      </div>
    </CWPageLayout>
  );
};

export default CreateCommunity;
