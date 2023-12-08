import React, { useState } from 'react';

import './CreateCommunity.scss';

import AddressInfo from 'models/AddressInfo';
import { SelectedCommunity } from 'views/components/component_kit/new_designs/CWCommunitySelector';
import CWFormSteps from 'views/components/component_kit/new_designs/CWFormSteps';
import { CWButton } from 'views/components/component_kit/new_designs/cw_button';
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

  const handleChangeStep = (action: number) => {
    setCreateCommunityStep((prevState) => prevState + action);
  };

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
          />
        );

      case CreateCommunityStep.Success:
        return <SuccessStep />;
    }
  };

  return (
    <div className="CreateCommunity">
      <CWFormSteps steps={getFormSteps(createCommunityStep)} />

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
