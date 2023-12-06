import React, { useState } from 'react';

import './CreateCommunity.scss';

import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/cw_button';
import BasicInformationStep from './steps/BasicInformationStep';
import CommunityTypeStep from './steps/CommunityTypeStep';
import SuccessStep from './steps/SuccessStep';

enum CreateCommunityStep {
  CommunityType,
  BasicInformation,
  Success,
}

const CreateCommunity = () => {
  const [createCommunityStep, setCreateCommunityStep] =
    useState<CreateCommunityStep>(CreateCommunityStep.CommunityType);

  const handleChangeStep = (action: number) => {
    setCreateCommunityStep((prevState) => prevState + action);
  };

  const getCurrentStep = () => {
    switch (createCommunityStep) {
      case CreateCommunityStep.CommunityType:
        return <CommunityTypeStep />;

      case CreateCommunityStep.BasicInformation:
        return <BasicInformationStep />;

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
          disabled={createCommunityStep === CreateCommunityStep.CommunityType}
          onClick={() => handleChangeStep(-1)}
        />
        <CWButton
          iconRight="arrowRight"
          buttonHeight="sm"
          label="Next"
          disabled={createCommunityStep === CreateCommunityStep.Success}
          onClick={() => handleChangeStep(1)}
        />
      </div>
    </div>
  );
};

export default CreateCommunity;
