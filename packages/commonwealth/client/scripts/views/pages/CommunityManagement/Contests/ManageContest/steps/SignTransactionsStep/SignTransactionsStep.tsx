import React, { useState } from 'react';

import { commonProtocol } from '@hicommonwealth/shared';
import app from 'state';
import {
  useCreateContestMutation,
  useDeployRecurringContestOnchainMutation,
  useDeploySingleContestOnchainMutation,
} from 'state/api/contests';
import { CWDivider } from 'views/components/component_kit/cw_divider';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import ActionSteps from 'views/pages/CreateCommunity/components/ActionSteps';
import {
  ActionStepProps,
  ActionStepsProps,
} from 'views/pages/CreateCommunity/components/ActionSteps/types';

import {
  ContestFeeType,
  ContestFormData,
  ContestRecurringType,
  LaunchContestStep,
} from '../../types';

import './SignTransactionsStep.scss';

interface SignTransactionsStepProps {
  onSetLaunchContestStep: (step: LaunchContestStep) => void;
  contestFormData: ContestFormData;
  onSetCreatedContestAddress: (address: string) => void;
}

const SEVEN_DAYS_IN_SECONDS = 60 * 60 * 24 * 7;

const SignTransactionsStep = ({
  onSetLaunchContestStep,
  contestFormData,
  onSetCreatedContestAddress,
}: SignTransactionsStepProps) => {
  const [launchContestData, setLaunchContestData] = useState({
    state: 'not-started' as ActionStepProps['state'],
    errorText: '',
  });

  const { mutateAsync: deploySingleContestOnchainMutation } =
    useDeploySingleContestOnchainMutation();
  const { mutateAsync: deployRecurringContestOnchainMutation } =
    useDeployRecurringContestOnchainMutation();
  const { mutateAsync: createContestMutation } = useCreateContestMutation();

  const isContestRecurring =
    contestFormData.contestRecurring === ContestRecurringType.Yes;
  const isDirectDepositSelected =
    contestFormData.feeType === ContestFeeType.DirectDeposit;

  const signTransaction = async () => {
    const ethChainId = app?.chain?.meta?.ChainNode?.ethChainId;
    const chainRpc = app?.chain?.meta?.ChainNode?.url;
    const namespaceName = app?.chain?.meta?.namespace;
    const contestLength = SEVEN_DAYS_IN_SECONDS;
    const stakeId = app?.chain?.meta?.CommunityStakes?.[0]?.stakeId;
    const voterShare = commonProtocol.CONTEST_VOTER_SHARE;
    const feeShare = commonProtocol.CONTEST_FEE_SHARE;
    const weight = Number(app?.chain?.meta?.CommunityStakes?.[0]?.voteWeight);
    const contestInterval = SEVEN_DAYS_IN_SECONDS;
    const prizeShare = contestFormData?.prizePercentage;
    const walletAddress = app.user.activeAccount?.address;
    const exchangeToken = isDirectDepositSelected
      ? contestFormData?.fundingTokenAddress
      : app?.chain?.meta?.CommunityStakes?.[0]?.stakeToken;
    const winnerShares = contestFormData?.payoutStructure;

    const single = {
      ethChainId,
      chainRpc,
      namespaceName,
      contestLength,
      winnerShares,
      stakeId,
      voterShare,
      weight,
      walletAddress,
      exchangeToken,
    };

    const recurring = {
      ethChainId,
      chainRpc,
      namespaceName,
      contestInterval,
      winnerShares,
      stakeId,
      prizeShare,
      voterShare,
      feeShare,
      weight,
      walletAddress,
    };

    let contestAddress: string;

    try {
      setLaunchContestData((prevState) => ({
        ...prevState,
        state: 'loading',
      }));

      isContestRecurring
        ? (contestAddress = await deployRecurringContestOnchainMutation(
            recurring,
          ))
        : (contestAddress = await deploySingleContestOnchainMutation(single));

      await createContestMutation({
        contest_address: contestAddress,
        name: contestFormData?.contestName,
        id: app.activeChainId(),
        image_url: contestFormData?.contestImage,
        funding_token_address: exchangeToken,
        prize_percentage: isContestRecurring
          ? contestFormData?.prizePercentage
          : 0,
        payout_structure: contestFormData?.payoutStructure,
        interval: isContestRecurring ? SEVEN_DAYS_IN_SECONDS : 0,
        topic_ids: contestFormData?.toggledTopicList.map((topic) => topic.id),
      });

      onSetLaunchContestStep('ContestLive');
      onSetCreatedContestAddress(contestAddress);
    } catch (error) {
      console.log('error', error);
      setLaunchContestData((prevState) => ({
        ...prevState,
        state: 'not-started',
        errorText:
          'There was an issue launching the contest. Please try again.',
      }));
    }
  };

  const handleBack = () => {
    onSetLaunchContestStep('DetailsForm');
  };

  const getActionSteps = (): ActionStepsProps['steps'] => {
    return [
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
          onClick: signTransaction,
        },
      },
    ];
  };

  const cancelDisabled = launchContestData.state === 'loading';

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
