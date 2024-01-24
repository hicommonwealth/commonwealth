import React from 'react';

import CWFormSteps from 'views/components/component_kit/new_designs/CWFormSteps';

import { MixpanelCommunityCreationEvent } from '../../../../../shared/analytics/types';
import { useBrowserAnalyticsTrack } from '../../../hooks/useBrowserAnalyticsTrack';
import BasicInformationStep from './steps/BasicInformationStep';
import CommunityStakeStep from './steps/CommunityStakeStep';
import CommunityTypeStep from './steps/CommunityTypeStep';
import SuccessStep from './steps/SuccessStep';
import useCreateCommunity from './useCreateCommunity';
import { CreateCommunityStep, getFormSteps } from './utils';

import './CreateCommunity.scss';

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
    handleCompleteBasicInformationStep,
    onChangeStep,
    showCommunityStakeStep,
  } = useCreateCommunity();

  useBrowserAnalyticsTrack({
    payload: { event: MixpanelCommunityCreationEvent.CREATE_COMMUNITY_VISITED },
  });

  const isSuccessStep =
    createCommunityStep === CreateCommunityStep.CommunityTypeSelection;

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

      case CreateCommunityStep.BasicInformation:
        return (
          <BasicInformationStep
            selectedAddress={selectedAddress}
            selectedCommunity={selectedCommunity}
            setSelectedChainId={setSelectedChainId}
            handleGoBack={() => onChangeStep(false)}
            handleContinue={handleCompleteBasicInformationStep}
          />
        );

      case CreateCommunityStep.CommunityStake:
        return (
          <CommunityStakeStep
            goToSuccessStep={() => onChangeStep(true)}
            createdCommunityName={createdCommunityName}
          />
        );

      case CreateCommunityStep.Success:
        return <SuccessStep communityId={createdCommunityId} />;
    }
  };

  return (
    <div className="CreateCommunity">
      {!isSuccessStep && (
        <CWFormSteps
          steps={getFormSteps(createCommunityStep, showCommunityStakeStep)}
        />
      )}

      {getCurrentStep()}
    </div>
  );
};

export default CreateCommunity;
