import React, { useState } from 'react';

import { STAKE_ID } from '@hicommonwealth/chains';
import { useUpdateCommunityMutation } from 'state/api/communities';
import { useUpdateCommunityStake } from 'state/api/communityStake';
import { CWDivider } from 'views/components/component_kit/cw_divider';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/cw_button';
import { openConfirmation } from 'views/modals/confirmation_modal';

import ActionSteps from '../../../components/ActionSteps';
import { ActionStepsProps } from '../../../components/ActionSteps/types';
import Hint from '../../../components/Hint';
import { ActionState, SignStakeTransactionsProps } from '../types';
import useNamespaceFactory from '../useNamespaceFactory';

import './SignStakeTransactions.scss';

const defaultActionState: ActionState = {
  state: 'not-started',
  errorText: '',
};

const SignStakeTransactions = ({
  goToSuccessStep,
  communityStakeData,
  selectedAddress,
  createdCommunityId,
}: SignStakeTransactionsProps) => {
  const [reserveNamespaceData, setReserveNamespaceData] =
    useState<ActionState>(defaultActionState);

  const [launchStakeData, setLaunchStakeData] =
    useState<ActionState>(defaultActionState);

  const { namespaceFactory } = useNamespaceFactory();
  const { mutateAsync: updateCommunity } = useUpdateCommunityMutation();
  const { mutateAsync: updateCommunityStake } = useUpdateCommunityStake();

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

      const txReceipt = await namespaceFactory.deployNamespace(
        communityStakeData.namespace,
        selectedAddress.address,
      );

      await updateCommunity({
        communityId: createdCommunityId,
        namespace: communityStakeData.namespace,
        symbol: communityStakeData.symbol,
        transactionHash: txReceipt.transactionHash,
      });

      setReserveNamespaceData((prevState) => ({
        ...prevState,
        state: 'completed',
      }));
    } catch (err) {
      console.log(err);

      const error = err?.message?.includes('Namespace already reserved')
        ? 'Namespace already reserved'
        : 'There was an issue creating the namespace. Please try again.';

      setReserveNamespaceData((prevState) => ({
        ...prevState,
        state: 'not-started',
        errorText: error,
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

      await namespaceFactory.configureCommunityStakes(
        communityStakeData.namespace,
        STAKE_ID,
      );

      await updateCommunityStake({
        communityId: createdCommunityId,
        stakeId: STAKE_ID,
      });

      setLaunchStakeData((prevState) => ({
        ...prevState,
        state: 'completed',
      }));

      goToSuccessStep();
    } catch (err) {
      console.log(err);

      const error =
        'There was an issue launching community stakes. Please try again.';

      setLaunchStakeData((prevState) => ({
        ...prevState,
        state: 'not-started',
        errorText: error,
      }));
    }
  };

  const handleCancel = () => {
    openConfirmation({
      title: 'Are you sure yo want to cancel?',
      description:
        'Community Stake has not been enabled for your community yet',
      buttons: [
        {
          label: 'Cancel',
          buttonType: 'destructive',
          buttonHeight: 'sm',
          onClick: goToSuccessStep,
        },
        {
          label: 'Continue',
          buttonType: 'primary',
          buttonHeight: 'sm',
        },
      ],
    });
  };

  const cancelDisabled =
    reserveNamespaceData.state === 'loading' ||
    launchStakeData.state === 'loading';

  return (
    <div className="SignStakeTransactions">
      <section className="header">
        <CWText type="h2">Sign transactions to launch stake?</CWText>
        <CWText type="b1" className="description">
          In order to launch community stake you will need to sign two
          transactions. The first launches your community namespace on the
          blockchain, and the second launches your community stake. Both
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
            disabled={cancelDisabled}
            onClick={handleCancel}
          />
        </section>
      </section>

      <Hint className="desktop" />
    </div>
  );
};

export default SignStakeTransactions;
