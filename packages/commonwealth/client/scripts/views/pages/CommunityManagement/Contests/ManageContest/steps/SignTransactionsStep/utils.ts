import {
  ActionStepProps,
  ActionStepsProps,
} from 'views/pages/CreateCommunity/components/ActionSteps/types';

interface GetActionStepsProps {
  isJudgedContest: boolean;
  configureNominationsData: {
    state: ActionStepProps['state'];
    errorText: string;
  };
  configureNominations: () => Promise<void>;
  isDirectDepositSelected: boolean;
  launchContestData: {
    state: ActionStepProps['state'];
    errorText: string;
  };
  signTransaction: () => Promise<void>;
}

export const getActionSteps = ({
  isJudgedContest,
  configureNominationsData,
  configureNominations,
  isDirectDepositSelected,
  launchContestData,
  signTransaction,
}: GetActionStepsProps): ActionStepsProps['steps'] => {
  const judgeTokenStep = isJudgedContest
    ? [
        {
          label: 'Register and mint judge tokens',
          state: configureNominationsData.state,
          errorText: configureNominationsData.errorText,
          actionButton: {
            label:
              configureNominationsData.state === 'completed'
                ? 'Signed'
                : 'Sign',
            disabled:
              configureNominationsData.state === 'loading' ||
              configureNominationsData.state === 'completed',
            onClick: configureNominations,
          },
        },
      ]
    : [];

  return [
    ...judgeTokenStep,
    {
      label: isDirectDepositSelected
        ? 'Launch contest'
        : 'Launch contest & re-route fees',
      state: launchContestData.state,
      errorText: launchContestData.errorText,
      actionButton: {
        label: launchContestData.state === 'completed' ? 'Signed' : 'Sign',
        disabled:
          launchContestData.state === 'loading' ||
          launchContestData.state === 'completed',
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        onClick: signTransaction,
      },
    },
  ];
};
