import { featureFlags } from 'helpers/feature-flags';
import { CWFormStepsProps } from 'views/components/component_kit/new_designs/CWFormSteps/CWFormSteps';

export enum CreateCommunityStep {
  CommunityTypeSelection = 0,
  BasicInformation = 1,
  CommunityStake = featureFlags.communityStake ? 2 : undefined,
  Success = featureFlags.communityStake ? 3 : 2,
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
    // TODO When integrating Backend, show only if EVM selected AND Ethereum Mainnet selected
    ...((featureFlags.communityStake
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
