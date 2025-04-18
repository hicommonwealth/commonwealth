import React from 'react';
import { CWFormStepsProps } from 'views/components/component_kit/new_designs/CWFormSteps/CWFormSteps';

export enum CreateCommunityStep {
  CommunityTypeSelection = 'CommunityTypeSelection',
  CommunityInformation = 'CommunityInformation',
  OnchainTransactions = 'OnchainTransactions',
  Success = 'Success',
}

export const getFormSteps = (
  createCommunityStep: CreateCommunityStep,
  showOnchainTransactionsStep: boolean,
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
    ...((showOnchainTransactionsStep
      ? [
          {
            label: 'Onchain Transactions',
            state:
              createCommunityStep < CreateCommunityStep.OnchainTransactions
                ? 'inactive'
                : createCommunityStep ===
                    CreateCommunityStep.OnchainTransactions
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
  showOnchainTransactionsStep: boolean,
) => {
  switch (createCommunityStep) {
    case CreateCommunityStep.CommunityTypeSelection:
      setCreateCommunityStep(CreateCommunityStep.CommunityInformation);
      return;
    case CreateCommunityStep.CommunityInformation:
      setCreateCommunityStep(
        forward
          ? showOnchainTransactionsStep
            ? CreateCommunityStep.OnchainTransactions
            : CreateCommunityStep.Success
          : CreateCommunityStep.CommunityTypeSelection,
      );
      return;
    case CreateCommunityStep.OnchainTransactions:
      setCreateCommunityStep(
        forward
          ? CreateCommunityStep.Success
          : CreateCommunityStep.CommunityInformation,
      );
      return;
  }
};
