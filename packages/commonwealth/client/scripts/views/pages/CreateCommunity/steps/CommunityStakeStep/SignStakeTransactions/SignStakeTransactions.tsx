import React, { useState } from 'react';

import { CWDivider } from 'views/components/component_kit/cw_divider';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/cw_button';
import { fakeRandomAPICall } from 'views/modals/ManageCommunityStakeModal/ManageCommunityStakeModal';

import ActionSteps from '../../../components/ActionSteps';
import {
  ActionStepProps,
  ActionStepsProps,
} from '../../../components/ActionSteps/types';
import Hint from '../../../components/Hint';

import './SignStakeTransactions.scss';

type ActionState = {
  state: ActionStepProps['state'];
  errorText: string;
};

interface SignStakeTransactionsProps {
  goToSuccessStep: () => void;
}

const defaultActionState: ActionState = {
  state: 'not-started',
  errorText: '',
};

const SignStakeTransactions = ({
  goToSuccessStep,
}: SignStakeTransactionsProps) => {
  const [reserveNamespaceData, setReserveNamespaceData] =
    useState<ActionState>(defaultActionState);

  const [launchStakeData, setLaunchStakeData] =
    useState<ActionState>(defaultActionState);

  const getActionSteps = (): ActionStepsProps['steps'] => {
    return [
      {
        state: reserveNamespaceData.state,
        label: 'Reserve community namespace',
        errorText: reserveNamespaceData.errorText,
        actionButton: {
          label: reserveNamespaceData.state === 'completed' ? 'Signed' : 'Sign',
          disabled:
            reserveNamespaceData.state === 'loading' ||
            reserveNamespaceData.state === 'completed',
          onClick: handleReserveCommunityNamespace,
        },
      },
      {
        state: launchStakeData.state,
        label: 'Launch community stake',
        errorText: launchStakeData.errorText,
        ...(reserveNamespaceData.state === 'completed'
          ? {
              actionButton: {
                label: 'Sign',
                disabled:
                  launchStakeData.state === 'loading' ||
                  launchStakeData.state === 'completed',
                onClick: handleLaunchCommunityStake,
              },
            }
          : {}),
      },
    ];
  };

  const handleReserveCommunityNamespace = async () => {
    try {
      setReserveNamespaceData((prevState) => ({
        ...prevState,
        state: 'loading',
        errorText: '',
      }));

      await fakeRandomAPICall();

      setReserveNamespaceData((prevState) => ({
        ...prevState,
        state: 'completed',
      }));
    } catch (err) {
      setReserveNamespaceData((prevState) => ({
        ...prevState,
        state: 'not-started',
        errorText: 'Some error here',
      }));
    }
  };

  const handleLaunchCommunityStake = async () => {
    try {
      setLaunchStakeData((prevState) => ({
        ...prevState,
        state: 'loading',
        errorText: '',
      }));

      await fakeRandomAPICall();

      setLaunchStakeData((prevState) => ({
        ...prevState,
        state: 'completed',
      }));
      goToSuccessStep();
    } catch (err) {
      setLaunchStakeData((prevState) => ({
        ...prevState,
        state: 'not-started',
        errorText: 'Some error here',
      }));
    }
  };

  return (
    <div className="SignStakeTransactions">
      <section className="header">
        <CWText type="h2">Sign transactions to launch stakes?</CWText>
        <CWText type="b1" className="description">
          In order to launch community stakes you will need to sign two
          transactions. The first launches your community namespace on the
          blockchain, and the second launches your community stakes. Both
          transactions have associated gas fees.
        </CWText>

        <Hint className="mobile" />

        <CWText fontWeight="medium" type="b1" className="description">
          Do not close the window or navigate away until the transactions are
          complete.
        </CWText>

        <ActionSteps steps={getActionSteps()} />

        <CWDivider />

        <section className="action-buttons">
          <CWButton
            type="button"
            label="Cancel"
            buttonWidth="wide"
            buttonType="secondary"
            onClick={goToSuccessStep}
          />
        </section>
      </section>

      <Hint className="desktop" />
    </div>
  );
};

export default SignStakeTransactions;
