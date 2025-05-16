import { CWFormStepsProps } from 'views/components/component_kit/new_designs/CWFormSteps';

export enum CreateTopicStep {
  TopicDetails = 'TopicDetails',
  WVMethodSelection = 'WVMethodSelection',
  WVConsent = 'WVConsent',
  WVNamespaceEnablement = 'WVNamespaceEnablement',
  WVERC20Details = 'WVERC20Details',
  WVSPLDetails = 'WVSPLDetails',
  WVSuiNativeDetails = 'WVSuiNativeDetails',
  WVSuiTokenDetails = 'WVSuiTokenDetails',
  WVStake = 'WVStake',
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
        createTopicStep === CreateTopicStep.WVERC20Details ||
        createTopicStep === CreateTopicStep.WVSPLDetails ||
        createTopicStep === CreateTopicStep.WVSuiNativeDetails ||
        createTopicStep === CreateTopicStep.WVSuiTokenDetails ||
        createTopicStep === CreateTopicStep.WVStake
          ? 'active'
          : 'inactive',
    },
  ];
};
