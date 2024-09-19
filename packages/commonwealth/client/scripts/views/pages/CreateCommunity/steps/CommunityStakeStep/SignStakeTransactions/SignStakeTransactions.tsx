import React from 'react';

import useBeforeUnload from 'hooks/useBeforeUnload';
import { CWDivider } from 'views/components/component_kit/cw_divider';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import { openConfirmation } from 'views/modals/confirmation_modal';

import ActionSteps from '../../../components/ActionSteps';
import { ActionStepsProps } from '../../../components/ActionSteps/types';
import Hint from '../../../components/Hint';
import { SignStakeTransactionsProps } from '../types';
import useLaunchCommunityStake from './useLaunchCommunityStake';
import useReserveCommunityNamespace from './useReserveCommunityNamespace';

import './SignStakeTransactions.scss';

const SignStakeTransactions = ({
  communityStakeData,
  selectedAddress,
  createdCommunityId,
  chainId,
  isTopicFlow,
  onSuccess,
  onCancel,
}: SignStakeTransactionsProps) => {
  const { handleReserveCommunityNamespace, reserveNamespaceData } =
    useReserveCommunityNamespace({
      communityId: createdCommunityId,
      namespace: communityStakeData.namespace,
      symbol: communityStakeData.symbol,
      userAddress: selectedAddress.address,
      chainId,
    });

  const { handleLaunchCommunityStake, launchStakeData } =
    useLaunchCommunityStake({
      namespace: communityStakeData.namespace,
      communityId: createdCommunityId,
      goToSuccessStep: onSuccess,
      selectedAddress: selectedAddress.address,
      chainId,
    });

  const isPreventLeaveEnabled = reserveNamespaceData.state !== 'not-started';
  useBeforeUnload(isPreventLeaveEnabled);

  const getActionSteps = (): ActionStepsProps['steps'] => {
    return [
      {
        label: 'Reserve community namespace',
        state: reserveNamespaceData.state,
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
        label: 'Launch community stake',
        state: launchStakeData.state,
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

  const handleCancel = () => {
    isTopicFlow
      ? onCancel()
      : openConfirmation({
          title: 'Are you sure you want to cancel?',
          description:
            'Community Stake has not been enabled for your community yet',
          buttons: [
            {
              label: 'Cancel',
              buttonType: 'destructive',
              buttonHeight: 'sm',
              onClick: onCancel,
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
            label={isTopicFlow ? 'Back' : 'Cancel'}
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
