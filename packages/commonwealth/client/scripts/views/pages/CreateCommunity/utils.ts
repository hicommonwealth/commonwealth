import { CWFormStepsProps } from 'views/components/component_kit/new_designs/CWFormSteps/CWFormSteps';

export enum CreateCommunityStep {
  CommunityTypeSelection,
  BasicInformation,
  Success,
}

export const getFormSteps = (
  createCommunityStep: CreateCommunityStep,
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
  ];
};
