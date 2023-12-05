import React, { useState } from 'react';

import './CreateCommunity.scss';

import AddressInfo from 'models/AddressInfo';
import { CWText } from 'views/components/component_kit/cw_text';
import { CommunityType } from 'views/components/component_kit/new_designs/CWCommunitySelector';
import { CWButton } from 'views/components/component_kit/new_designs/cw_button';
import BasicInformationStep from './steps/BasicInformationStep';
import CommunityTypeStep from './steps/CommunityTypeStep';
import SuccessStep from './steps/SuccessStep';

enum CreateCommunityStep {
  CommunityTypeSelection,
  BasicInformation,
  Success,
}

const CreateCommunity = () => {
  const [createCommunityStep, setCreateCommunityStep] =
    useState<CreateCommunityStep>(CreateCommunityStep.CommunityTypeSelection);
  const [selectedCommunityType, setSelectedCommunityType] =
    useState<CommunityType>(null);
  const [selectedAddress, setSelectedAddress] = useState<AddressInfo>(null);
  const handleChangeStep = (action: number) => {
    setCreateCommunityStep((prevState) => prevState + action);
  };

  const getCurrentStep = () => {
    switch (createCommunityStep) {
      case CreateCommunityStep.CommunityTypeSelection:
        return (
          <CommunityTypeStep
            selectedCommunityType={selectedCommunityType}
            setSelectedCommunityType={setSelectedCommunityType}
            setSelectedAddress={setSelectedAddress}
            handleContinue={() => handleChangeStep(1)}
          />
        );

      case CreateCommunityStep.BasicInformation:
        return (
          <BasicInformationStep
            selectedAddress={selectedAddress}
            selectedCommunityType={selectedCommunityType}
          />
        );

      case CreateCommunityStep.Success:
        return <SuccessStep />;
    }
  };

  return (
    <div className="CreateCommunity">
      <CWText type="h1">Crete Community</CWText>

      {getCurrentStep()}

      <div className="footer">
        <CWButton
          iconLeft="arrowLeft"
          buttonHeight="sm"
          label="Prev"
          disabled={
            createCommunityStep === CreateCommunityStep.CommunityTypeSelection
          }
          onClick={() => handleChangeStep(-1)}
        />
      </div>
    </div>
  );
};

export default CreateCommunity;
