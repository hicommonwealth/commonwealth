import React, { useState } from 'react';

import { CWDivider } from 'views/components/component_kit/cw_divider';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import ActionSteps from 'views/pages/CreateCommunity/components/ActionSteps';
import {
  ActionStepProps,
  ActionStepsProps,
} from 'views/pages/CreateCommunity/components/ActionSteps/types';

import { LaunchContestStep } from '../../types';

import './SignTransactionsStep.scss';

interface SignTransactionsStepProps {
  onSetLaunchContestStep: (step: LaunchContestStep) => void;
  isDirectDepositSelected: boolean;
}

const SignTransactionsStep = ({
  onSetLaunchContestStep,
  isDirectDepositSelected,
}: SignTransactionsStepProps) => {
  // TODO all the logic here is temporary, it will be moved to react-query
  // when hooking up with the backend/protocol layer
  const [launchContestData, setLaunchContestData] = useState({
    state: 'not-started' as ActionStepProps['state'],
    errorText: '',
  });

  const [launchContestAndRerouteFeesData, setLaunchContestAndRerouteFeesData] =
    useState({
      state: 'not-started' as ActionStepProps['state'],
      errorText: '',
    });

  const handleLaunchContest = () => {
    setLaunchContestData((prevState) => ({
      ...prevState,
      state: 'loading',
    }));

    setTimeout(() => {
      setLaunchContestData((prevState) => ({
        ...prevState,
        state: 'completed',
      }));
      onSetLaunchContestStep('ContestLive');
    }, 2000);
  };

  const handleLaunchContestAndRerouteFees = () => {
    setLaunchContestAndRerouteFeesData((prevState) => ({
      ...prevState,
      state: 'loading',
    }));

    setTimeout(() => {
      setLaunchContestAndRerouteFeesData((prevState) => ({
        ...prevState,
        state: 'completed',
      }));
      onSetLaunchContestStep('ContestLive');
    }, 2000);
  };

  const handleBack = () => {
    onSetLaunchContestStep('DetailsForm');
  };

  const getActionSteps = (): ActionStepsProps['steps'] => {
    return isDirectDepositSelected
      ? [
          {
            label: 'Launch contest',
            state: launchContestData.state,
            errorText: launchContestData.errorText,
            actionButton: {
              label:
                launchContestData.state === 'completed' ? 'Signed' : 'Sign',
              disabled:
                launchContestData.state === 'loading' ||
                launchContestData.state === 'completed',
              onClick: handleLaunchContest,
            },
          },
        ]
      : [
          {
            label: 'Launch contest & re-route fees',
            state: launchContestAndRerouteFeesData.state,
            errorText: launchContestAndRerouteFeesData.errorText,
            actionButton: {
              label:
                launchContestAndRerouteFeesData.state === 'completed'
                  ? 'Signed'
                  : 'Sign',
              disabled:
                launchContestAndRerouteFeesData.state === 'loading' ||
                launchContestAndRerouteFeesData.state === 'completed',
              onClick: handleLaunchContestAndRerouteFees,
            },
          },
        ];
  };

  const cancelDisabled =
    launchContestData.state === 'loading' ||
    launchContestAndRerouteFeesData.state === 'loading';

  return (
    <CWPageLayout>
      <div className="SignTransactionsStep">
        <CWText type="h2">Sign transactions to launch contest</CWText>
        <CWText type="b1" className="description">
          You must sign two (2) transactions to launch your community contest.
          The first is to route the fees generated from stake to the contest
          address. The second is to launch the contest contract onchain.
        </CWText>

        <CWText fontWeight="medium" type="b1" className="description">
          Do not close the window or navigate away until the transactions are
          complete.
        </CWText>

        <ActionSteps steps={getActionSteps()} />

        <CWDivider />

        <div className="action-buttons">
          <CWButton
            type="button"
            label="Back"
            buttonType="secondary"
            disabled={cancelDisabled}
            onClick={handleBack}
          />
        </div>
      </div>
    </CWPageLayout>
  );
};

export default SignTransactionsStep;
