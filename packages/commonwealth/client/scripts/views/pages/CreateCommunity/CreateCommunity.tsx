import AddressInfo from 'models/AddressInfo';
import React, { useState } from 'react';
import { SelectedCommunity } from 'views/components/component_kit/new_designs/CWCommunitySelector';
import CWFormSteps from 'views/components/component_kit/new_designs/CWFormSteps';
import { MixpanelCommunityCreationEvent } from '../../../../../shared/analytics/types';
import { useBrowserAnalyticsTrack } from '../../../hooks/useBrowserAnalyticsTrack';

import BasicInformationStep from './steps/BasicInformationStep';
import CommunityStakeStep from './steps/CommunityStakeStep';
import CommunityTypeStep from './steps/CommunityTypeStep';
import SuccessStep from './steps/SuccessStep';
import { CreateCommunityStep, getFormSteps } from './utils';

import './CreateCommunity.scss';

const CreateCommunity = () => {
  const [createCommunityStep, setCreateCommunityStep] =
    useState<CreateCommunityStep>(CreateCommunityStep.CommunityTypeSelection);
  const [selectedCommunity, setSelectedCommunity] = useState<SelectedCommunity>(
    { type: null, chainBase: null },
  );
  const [selectedAddress, setSelectedAddress] = useState<AddressInfo>(null);
  const [createdCommunityId, setCreatedCommunityId] = useState('');
  const [createdCommunityName, setCreatedCommunityName] = useState('');

  useBrowserAnalyticsTrack({
    payload: { event: MixpanelCommunityCreationEvent.CREATE_COMMUNITY_VISITED },
  });

  const handleChangeStep = (action: number) => {
    setCreateCommunityStep((prevState) => prevState + action);
  };

  const handleCompleteBasicInformationStep = (
    communityId: string,
    communityName: string,
  ) => {
    handleChangeStep(1);
    setCreatedCommunityId(communityId);
    setCreatedCommunityName(communityName);
  };

  const isSuccessStep = createCommunityStep === CreateCommunityStep.Success;

  const getCurrentStep = () => {
    switch (createCommunityStep) {
      case CreateCommunityStep.CommunityTypeSelection:
        return (
          <CommunityTypeStep
            selectedCommunity={selectedCommunity}
            setSelectedCommunity={setSelectedCommunity}
            setSelectedAddress={setSelectedAddress}
            handleContinue={() => handleChangeStep(1)}
          />
        );

      case CreateCommunityStep.BasicInformation:
        return (
          <BasicInformationStep
            selectedAddress={selectedAddress}
            selectedCommunity={selectedCommunity}
            handleGoBack={() => handleChangeStep(-1)}
            handleContinue={handleCompleteBasicInformationStep}
          />
        );

      case CreateCommunityStep.CommunityStake:
        return (
          <CommunityStakeStep
            onOptOutEnablingStake={() => handleChangeStep(1)}
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
        <CWFormSteps steps={getFormSteps(createCommunityStep)} />
      )}

      {getCurrentStep()}
    </div>
  );
};

export default CreateCommunity;
