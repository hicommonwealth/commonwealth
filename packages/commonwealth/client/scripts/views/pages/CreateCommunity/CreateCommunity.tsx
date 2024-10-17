import React from 'react';

import CWFormSteps from 'views/components/component_kit/new_designs/CWFormSteps';

import { MixpanelCommunityCreationEvent } from '../../../../../shared/analytics/types';
import { useBrowserAnalyticsTrack } from '../../../hooks/useBrowserAnalyticsTrack';
import CommunityStakeStep from './steps/CommunityStakeStep';
import CommunityTypeStep from './steps/CommunityTypeStep';
import SuccessStep from './steps/SuccessStep';
import useCreateCommunity from './useCreateCommunity';
import { CreateCommunityStep, getFormSteps } from './utils';

import { useFlag } from 'hooks/useFlag';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import useAppStatus from '../../../hooks/useAppStatus';
import './CreateCommunity.scss';
import CommunityInformationStep from './steps/CommunityInformationStep';

const CreateCommunity = () => {
  const weightedTopicsEnabled = useFlag('weightedTopics');

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
    showCommunityStakeStep,
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

      case CreateCommunityStep.CommunityStake:
        return (
          <CommunityStakeStep
            goToSuccessStep={() => onChangeStep(true)}
            createdCommunityName={createdCommunityName}
            createdCommunityId={createdCommunityId}
            selectedAddress={selectedAddress}
            // @ts-expect-error <StrictNullChecks/>
            chainId={selectedChainId}
            onlyNamespace={weightedTopicsEnabled}
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
              showCommunityStakeStep,
              weightedTopicsEnabled,
            )}
          />
        )}

        {getCurrentStep()}
      </div>
    </CWPageLayout>
  );
};

export default CreateCommunity;
