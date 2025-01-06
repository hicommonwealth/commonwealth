import React from 'react';
import { CWFormStepsProps } from 'views/components/component_kit/new_designs/CWFormSteps/CWFormSteps';

export enum CreateCommunityStep {
  CommunityTypeSelection = 'CommunityTypeSelection',
  CommunityInformation = 'CommunityInformation',
  CommunityStake = 'CommunityStake',
  Success = 'Success',
}

export const getFormSteps = (
  createCommunityStep: CreateCommunityStep,
  showCommunityStakeStep: boolean,
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
      label: 'Community Information',
      state:
        createCommunityStep < CreateCommunityStep.CommunityInformation
          ? 'inactive'
          : createCommunityStep === CreateCommunityStep.CommunityInformation
            ? 'active'
            : 'completed',
    },
    ...((showCommunityStakeStep
      ? [
          {
            label: 'Namespace',
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
) => {
  switch (createCommunityStep) {
    case CreateCommunityStep.CommunityTypeSelection:
      setCreateCommunityStep(CreateCommunityStep.CommunityInformation);
      return;
    case CreateCommunityStep.CommunityInformation:
      setCreateCommunityStep(
        forward
          ? showCommunityStakeStep
            ? CreateCommunityStep.CommunityStake
            : CreateCommunityStep.Success
          : CreateCommunityStep.CommunityTypeSelection,
      );
      return;
    case CreateCommunityStep.CommunityStake:
      setCreateCommunityStep(
        forward
          ? CreateCommunityStep.Success
          : CreateCommunityStep.CommunityInformation,
      );
      return;
  }
};
