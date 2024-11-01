import React, { useState } from 'react';

import { commonProtocol, ZERO_ADDRESS } from '@hicommonwealth/shared';
import useAppStatus from 'hooks/useAppStatus';
import { useBrowserAnalyticsTrack } from 'hooks/useBrowserAnalyticsTrack';
import { useFlag } from 'hooks/useFlag';
import {
  BaseMixpanelPayload,
  MixpanelContestEvents,
} from 'shared/analytics/types';
import app from 'state';
import {
  useCreateContestMutation,
  useDeployRecurringContestOnchainMutation,
  useDeploySingleContestOnchainMutation,
  useDeploySingleERC20ContestOnchainMutation,
} from 'state/api/contests';
import { DeploySingleERC20ContestOnchainProps } from 'state/api/contests/deploySingleERC20ContestOnchain';
import useUserStore from 'state/ui/user';
import { useCommunityStake } from 'views/components/CommunityStake';
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
  fundingTokenTicker: string;
  fundingTokenDecimals: number;
}

const SEVEN_DAYS_IN_SECONDS = 60 * 60 * 24 * 7;
const ONE_HOUR_IN_SECONDS = 60 * 60;

const SignTransactionsStep = ({
  onSetLaunchContestStep,
  contestFormData,
  onSetCreatedContestAddress,
  fundingTokenTicker,
  fundingTokenDecimals,
}: SignTransactionsStepProps) => {
  const weightedTopicsEnabled = useFlag('weightedTopics');

  const [launchContestData, setLaunchContestData] = useState({
    state: 'not-started' as ActionStepProps['state'],
    errorText: '',
  });

  const { stakeData } = useCommunityStake();
  const { mutateAsync: deploySingleContestOnchainMutation } =
    useDeploySingleContestOnchainMutation();
  const { mutateAsync: deployRecurringContestOnchainMutation } =
    useDeployRecurringContestOnchainMutation();
  const { mutateAsync: deploySingleERC20ContestOnchainMutation } =
    useDeploySingleERC20ContestOnchainMutation();

  const { mutateAsync: createContestMutation } = useCreateContestMutation();
  const user = useUserStore();

  const { isAddedToHomeScreen } = useAppStatus();

  const { trackAnalytics } = useBrowserAnalyticsTrack<BaseMixpanelPayload>({
    onAction: true,
  });

  const isContestRecurring =
    contestFormData.contestRecurring === ContestRecurringType.Yes;
  const isDirectDepositSelected =
    contestFormData.feeType === ContestFeeType.DirectDeposit;

  const devContest = useFlag('contestDev');

  const signTransaction = async () => {
    const ethChainId = app?.chain?.meta?.ChainNode?.eth_chain_id || 0;
    const chainRpc = app?.chain?.meta?.ChainNode?.url || '';
    const namespaceName = app?.chain?.meta?.namespace;
    const contestLength = devContest
      ? ONE_HOUR_IN_SECONDS
      : weightedTopicsEnabled
        ? contestFormData?.contestDuration
        : SEVEN_DAYS_IN_SECONDS;
    const stakeId = stakeData?.stake_id;
    const voterShare = commonProtocol.CONTEST_VOTER_SHARE;
    const feeShare = commonProtocol.CONTEST_FEE_SHARE;
    const weight = stakeData?.vote_weight;
    const contestInterval = devContest
      ? ONE_HOUR_IN_SECONDS
      : weightedTopicsEnabled
        ? contestFormData?.contestDuration
        : SEVEN_DAYS_IN_SECONDS;
    const prizeShare = contestFormData?.prizePercentage;
    const walletAddress = user.activeAccount?.address;
    const exchangeToken = isDirectDepositSelected
      ? contestFormData?.fundingTokenAddress || ZERO_ADDRESS
      : stakeData?.stake_token;
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

    const singleERC20 = {
      ethChainId,
      chainRpc,
      namespaceName,
      contestInterval: contestLength,
      winnerShares,
      voteToken: exchangeToken,
      voterShare,
      walletAddress,
      exchangeToken,
    } as DeploySingleERC20ContestOnchainProps;

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
            // @ts-expect-error <StrictNullChecks/>
            recurring,
          ))
        : weightedTopicsEnabled
          ? (contestAddress =
              await deploySingleERC20ContestOnchainMutation(singleERC20))
          : // @ts-expect-error <StrictNullChecks/>
            (contestAddress = await deploySingleContestOnchainMutation(single));

      await createContestMutation({
        contest_address: contestAddress,
        name: contestFormData?.contestName,
        id: app.activeChainId() || '',
        image_url: contestFormData?.contestImage,
        funding_token_address: exchangeToken,
        prize_percentage: isContestRecurring
          ? contestFormData?.prizePercentage
          : 0,
        payout_structure: contestFormData?.payoutStructure,
        interval: isContestRecurring ? contestInterval! : 0,
        topic_ids: weightedTopicsEnabled
          ? [contestFormData?.contestTopic?.value as number]
          : contestFormData?.toggledTopicList
              .filter((t) => t.checked)
              .map((t) => t.id!),
        ticker: fundingTokenTicker,
        decimals: fundingTokenDecimals,
      });

      onSetLaunchContestStep('ContestLive');
      onSetCreatedContestAddress(contestAddress);
      trackAnalytics({
        event: MixpanelContestEvents.CONTEST_CREATED,
        isPWA: isAddedToHomeScreen,
      });
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
          // eslint-disable-next-line @typescript-eslint/no-misused-promises
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
          You must sign this transaction to deploy the contest.{' '}
          {isContestRecurring
            ? 'It routes the fees generated from stake to the contest address and launchs the contest contract onchain.'
            : 'It launchs the contest contract onchain.'}
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
