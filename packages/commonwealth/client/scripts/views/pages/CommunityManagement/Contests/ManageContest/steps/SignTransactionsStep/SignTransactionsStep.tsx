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
}

const SignTransactionsStep = ({
  onSetLaunchContestStep,
}: SignTransactionsStepProps) => {
  // TODO all the logic here is temporary, it will be moved to react-query
  // when hooking up with the backend/protocol layer
  const [launchContestOnchainData, setLaunchContestOnchainData] = useState({
    state: 'not-started' as ActionStepProps['state'],
    errorText: '',
  });

  const [rerouteCommunityStakeFeesData, setRerouteCommunityStakeFeesData] =
    useState({
      state: 'not-started' as ActionStepProps['state'],
      errorText: '',
    });

  const handleLaunchContestOnchain = () => {
    setLaunchContestOnchainData((prevState) => ({
      ...prevState,
      state: 'loading',
    }));

    setTimeout(() => {
      setLaunchContestOnchainData((prevState) => ({
        ...prevState,
        state: 'completed',
      }));
    }, 2000);
  };

  const handleRerouteCommunityStakeFees = () => {
    setRerouteCommunityStakeFeesData((prevState) => ({
      ...prevState,
      state: 'loading',
    }));

    setTimeout(() => {
      setRerouteCommunityStakeFeesData((prevState) => ({
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
    return [
      {
        label: 'Launch contest onchain',
        state: launchContestOnchainData.state,
        errorText: launchContestOnchainData.errorText,
        actionButton: {
          label:
            launchContestOnchainData.state === 'completed' ? 'Signed' : 'Sign',
          disabled:
            launchContestOnchainData.state === 'loading' ||
            launchContestOnchainData.state === 'completed',
          onClick: handleLaunchContestOnchain,
        },
      },
      {
        label: 'Re-route Community Stake fees',
        state: rerouteCommunityStakeFeesData.state,
        errorText: rerouteCommunityStakeFeesData.errorText,
        ...(launchContestOnchainData.state === 'completed'
          ? {
              actionButton: {
                label: 'Sign',
                disabled:
                  rerouteCommunityStakeFeesData.state === 'loading' ||
                  rerouteCommunityStakeFeesData.state === 'completed',
                onClick: handleRerouteCommunityStakeFees,
              },
            }
          : {}),
      },
    ];
  };

  const cancelDisabled =
    launchContestOnchainData.state === 'loading' ||
    rerouteCommunityStakeFeesData.state === 'loading';

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
