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
} from 'state/api/contests';
import { useTokenMetadataQuery } from 'state/api/tokens';
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
}

const SEVEN_DAYS_IN_SECONDS = 60 * 60 * 24 * 7;
const ONE_HOUR_IN_SECONDS = 60 * 60;

const SignTransactionsStep = ({
  onSetLaunchContestStep,
  contestFormData,
  onSetCreatedContestAddress,
}: SignTransactionsStepProps) => {
  const [launchContestData, setLaunchContestData] = useState({
    state: 'not-started' as ActionStepProps['state'],
    errorText: '',
  });

  const chainId = app.chain.meta.ChainNode?.id || 0;
  const { data: tokenMetadata } = useTokenMetadataQuery({
    tokenId: contestFormData.fundingTokenAddress || '',
    chainId,
    apiEnabled: !!contestFormData.fundingTokenAddress,
  });

  const { stakeData } = useCommunityStake();
  const { mutateAsync: deploySingleContestOnchainMutation } =
    useDeploySingleContestOnchainMutation();
  const { mutateAsync: deployRecurringContestOnchainMutation } =
    useDeployRecurringContestOnchainMutation();
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
      : SEVEN_DAYS_IN_SECONDS;
    const stakeId = stakeData?.stake_id;
    const voterShare = commonProtocol.CONTEST_VOTER_SHARE;
    const feeShare = commonProtocol.CONTEST_FEE_SHARE;
    const weight = stakeData?.vote_weight;
    const contestInterval = devContest
      ? ONE_HOUR_IN_SECONDS
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
        interval: isContestRecurring ? contestInterval : 0,
        topic_ids: contestFormData?.toggledTopicList
          .filter((t) => t.checked)
          .map((t) => t.id),
        ticker: tokenMetadata?.symbol || 'ETH',
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
