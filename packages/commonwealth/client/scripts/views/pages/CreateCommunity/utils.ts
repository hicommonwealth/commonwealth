import React from 'react';

import { CWFormStepsProps } from 'views/components/component_kit/new_designs/CWFormSteps/CWFormSteps';

export enum CreateCommunityStep {
  CommunityTypeSelection = 'CommunityTypeSelection',
  BasicInformation = 'BasicInformation',
  CommunityStake = 'CommunityStake',
  Success = 'Success',
}

export const getFormSteps = (
  createCommunityStep: CreateCommunityStep,
  showCommunityStakeStep: boolean,
  communityStakeEnabled: boolean,
): CWFormStepsProps['steps'] => {
  return [
    {
      label: 'Community Type',
      state:
        createCommunityStep === CreateCommunityStep.CommunityTypeSelection
          ? 'active'
          : 'completed',
    },
    {
      label: 'Basic Information',
      state:
        createCommunityStep < CreateCommunityStep.BasicInformation
          ? 'inactive'
          : createCommunityStep === CreateCommunityStep.BasicInformation
          ? 'active'
          : 'completed',
    },
    ...((communityStakeEnabled && showCommunityStakeStep
      ? [
          {
            label: 'Community Stake',
            state:
              createCommunityStep < CreateCommunityStep.CommunityStake
                ? 'inactive'
                : createCommunityStep === CreateCommunityStep.CommunityStake
                ? 'active'
                : 'completed',
          },
        ]
      : []) as CWFormStepsProps['steps']),
  ];
};

export const handleChangeStep = (
  forward: boolean,
  createCommunityStep: CreateCommunityStep,
  setCreateCommunityStep: React.Dispatch<
    React.SetStateAction<CreateCommunityStep>
  >,
  showCommunityStakeStep: boolean,
  communityStakeEnabled: boolean,
) => {
  switch (createCommunityStep) {
    case CreateCommunityStep.CommunityTypeSelection:
      setCreateCommunityStep(CreateCommunityStep.BasicInformation);
      return;
    case CreateCommunityStep.BasicInformation:
      setCreateCommunityStep(
        forward
          ? communityStakeEnabled && showCommunityStakeStep
            ? CreateCommunityStep.CommunityStake
            : CreateCommunityStep.Success
          : CreateCommunityStep.CommunityTypeSelection,
      );
      return;
    case CreateCommunityStep.CommunityStake:
      setCreateCommunityStep(
        forward
          ? CreateCommunityStep.Success
          : CreateCommunityStep.BasicInformation,
      );
      return;
  }
};
