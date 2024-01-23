import React, { useState } from 'react';

import AddressInfo from 'models/AddressInfo';
import { SelectedCommunity } from 'views/components/component_kit/new_designs/CWCommunitySelector';
import CWFormSteps from 'views/components/component_kit/new_designs/CWFormSteps';

import { MixpanelCommunityCreationEvent } from '../../../../../shared/analytics/types';
import { useBrowserAnalyticsTrack } from '../../../hooks/useBrowserAnalyticsTrack';
import BasicInformationStep from './steps/BasicInformationStep';
import { ETHEREUM_MAINNET_ID } from './steps/BasicInformationStep/BasicInformationForm/constants';
import CommunityStakeStep from './steps/CommunityStakeStep';
import CommunityTypeStep from './steps/CommunityTypeStep';
import SuccessStep from './steps/SuccessStep';
import { CreateCommunityStep, getFormSteps, handleChangeStep } from './utils';

import './CreateCommunity.scss';

const CreateCommunity = () => {
  const [createCommunityStep, setCreateCommunityStep] =
    useState<CreateCommunityStep>(CreateCommunityStep.CommunityTypeSelection);
  const [selectedCommunity, setSelectedCommunity] = useState<SelectedCommunity>(
    { type: null, chainBase: null },
  );
  const [selectedAddress, setSelectedAddress] = useState<AddressInfo>(null);
  const [selectedChainId, setSelectedChainId] = useState(null);
  const [createdCommunityId, setCreatedCommunityId] = useState('');
  const [createdCommunityName, setCreatedCommunityName] = useState('');

  useBrowserAnalyticsTrack({
    payload: { event: MixpanelCommunityCreationEvent.CREATE_COMMUNITY_VISITED },
  });

  const isSuccessStep = createCommunityStep === CreateCommunityStep.Success;

  const isValidStepToShowCommunityStakeFormStep = [
    CreateCommunityStep.BasicInformation,
    CreateCommunityStep.CommunityStake,
  ].includes(createCommunityStep);
  const isEthereumMainnetSelected = selectedChainId === ETHEREUM_MAINNET_ID;
  const showCommunityStakeStep =
    isValidStepToShowCommunityStakeFormStep &&
    selectedCommunity.type === 'ethereum' &&
    isEthereumMainnetSelected;

  const handleCompleteBasicInformationStep = (
    communityId: string,
    communityName: string,
  ) => {
    onChangeStep(true);
    setCreatedCommunityId(communityId);
    setCreatedCommunityName(communityName);
  };

  const onChangeStep = (forward: boolean) => {
    handleChangeStep(
      forward,
      createCommunityStep,
      setCreateCommunityStep,
      showCommunityStakeStep,
    );
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
            onOptOutEnablingStake={() => onChangeStep(true)}
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
