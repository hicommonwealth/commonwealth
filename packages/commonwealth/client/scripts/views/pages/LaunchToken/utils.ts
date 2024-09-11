import React from 'react';
import { CWFormStepsProps } from 'views/components/component_kit/new_designs/CWFormSteps/CWFormSteps';

export enum CreateTokenCommunityStep {
  TokenInformation = 'TokenInformation',
  CommunityInformation = 'CommunityInformation',
  SignatureLaunch = 'SignatureLaunch',
  Success = 'Success',
}

export const getFormSteps = (
  activeStep: CreateTokenCommunityStep,
): CWFormStepsProps['steps'] => {
  return [
    {
      label: 'Token Details',
      state:
        activeStep === CreateTokenCommunityStep.TokenInformation
          ? 'active'
          : 'completed',
    },
    {
      label: 'Community',
      state:
        activeStep < CreateTokenCommunityStep.CommunityInformation
          ? 'inactive'
          : activeStep === CreateTokenCommunityStep.CommunityInformation
            ? 'active'
            : 'completed',
    },
    {
      label: 'Sign and Launch',
      state:
        activeStep < CreateTokenCommunityStep.SignatureLaunch
          ? 'inactive'
          : activeStep === CreateTokenCommunityStep.SignatureLaunch
            ? 'active'
            : 'completed',
    },
  ];
};

export const handleChangeStep = (
  forward: boolean,
  activeStep: CreateTokenCommunityStep,
  setActiveStep: React.Dispatch<React.SetStateAction<CreateTokenCommunityStep>>,
) => {
  switch (activeStep) {
    case CreateTokenCommunityStep.TokenInformation:
      setActiveStep(CreateTokenCommunityStep.CommunityInformation);
      return;
    case CreateTokenCommunityStep.CommunityInformation:
      setActiveStep(
        forward
          ? CreateTokenCommunityStep.SignatureLaunch
          : CreateTokenCommunityStep.TokenInformation,
      );
      return;
    case CreateTokenCommunityStep.SignatureLaunch:
      setActiveStep(
        forward
          ? CreateTokenCommunityStep.Success
          : CreateTokenCommunityStep.CommunityInformation,
      );
      return;
  }
};
