import React, { useState } from 'react';

import './CreateCommunity.scss';

import AddressInfo from 'models/AddressInfo';
import { SelectedCommunity } from 'views/components/component_kit/new_designs/CWCommunitySelector';
import CWFormSteps from 'views/components/component_kit/new_designs/CWFormSteps';
import BasicInformationStep from './steps/BasicInformationStep';
import CommunityTypeStep from './steps/CommunityTypeStep';
import SuccessStep from './steps/SuccessStep';
import { CreateCommunityStep, getFormSteps } from './utils';

const CreateCommunity = () => {
  const [createCommunityStep, setCreateCommunityStep] =
    useState<CreateCommunityStep>(CreateCommunityStep.CommunityTypeSelection);
  const [selectedCommunity, setSelectedCommunity] = useState<SelectedCommunity>(
    { type: null, chainBase: null },
  );
  const [selectedAddress, setSelectedAddress] = useState<AddressInfo>(null);
  const [createdCommunityId, setCreatedCommunityId] = useState('');

  const handleChangeStep = (action: number) => {
    setCreateCommunityStep((prevState) => prevState + action);
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
            handleContinue={(communityId) => {
              handleChangeStep(1);
              setCreatedCommunityId(communityId);
            }}
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
