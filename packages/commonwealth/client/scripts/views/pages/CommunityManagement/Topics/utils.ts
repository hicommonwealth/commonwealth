import { CWFormStepsProps } from 'views/components/component_kit/new_designs/CWFormSteps';

export enum CreateTopicStep {
  TopicDetails = 'TopicDetails',
  WVMethodSelection = 'WVMethodSelection',
  WVConsent = 'WVConsent',
  WVDetails = 'WVDetails',
}

export const getCreateTopicSteps = (
  createTopicStep: CreateTopicStep,
): CWFormStepsProps['steps'] => {
  return [
    {
      label: 'Topic details',
      state:
        createTopicStep === CreateTopicStep.TopicDetails
          ? 'active'
          : 'completed',
    },
    {
      label: 'Weighted voting',
      state:
        createTopicStep === CreateTopicStep.WVConsent ||
        createTopicStep === CreateTopicStep.WVMethodSelection ||
        createTopicStep === CreateTopicStep.WVDetails
          ? 'active'
          : 'inactive',
    },
  ];
};
