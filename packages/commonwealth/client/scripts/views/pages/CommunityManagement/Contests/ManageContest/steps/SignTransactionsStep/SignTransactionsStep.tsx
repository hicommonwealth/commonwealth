import { commonProtocol } from '@hicommonwealth/evm-protocols';
import { ZERO_ADDRESS } from '@hicommonwealth/shared';
import useGetJudgeStatusQuery from 'client/scripts/state/api/contests/getJudgeStatus';
import useAppStatus from 'hooks/useAppStatus';
import { useBrowserAnalyticsTrack } from 'hooks/useBrowserAnalyticsTrack';
import { useFlag } from 'hooks/useFlag';
import React, { useState } from 'react';
import {
  BaseMixpanelPayload,
  MixpanelContestEvents,
} from 'shared/analytics/types';
import app from 'state';
import {
  useConfigureNominationsMutation,
  useCreateContestMutation,
  useDeployRecurringContestOnchainMutation,
  useDeploySingleERC20ContestOnchainMutation,
  useDeploySingleJudgedContestOnchainMutation,
} from 'state/api/contests';
import { DeploySingleERC20ContestOnchainProps } from 'state/api/contests/deploySingleERC20ContestOnchain';
import { DeploySingleJudgedContestOnchainProps } from 'state/api/contests/deploySingleJudgedContestOnchain';
import useUserStore from 'state/ui/user';
import { useCommunityStake } from 'views/components/CommunityStake';
import { CWDivider } from 'views/components/component_kit/cw_divider';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import ActionSteps from 'views/pages/CreateCommunity/components/ActionSteps';
import { ActionStepProps } from 'views/pages/CreateCommunity/components/ActionSteps/types';
import { isJudgedContest } from '../../../utils';
import {
  ContestFeeType,
  ContestFormData,
  ContestRecurringType,
  LaunchContestStep,
} from '../../types';
import './SignTransactionsStep.scss';
import { getActionSteps } from './utils';

interface SignTransactionsStepProps {
  onSetLaunchContestStep: (step: LaunchContestStep) => void;
  contestFormData: ContestFormData;
  onSetCreatedContestAddress: (address: string) => void;
  fundingTokenTicker: string;
  fundingTokenDecimals: number;
  isFarcasterContest: boolean;
}

const ONE_HOUR_IN_SECONDS = 60 * 60;

const CUSTOM_CONTEST_DURATION_IN_SECONDS =
  Number(process.env.CONTEST_DURATION_IN_SEC) || ONE_HOUR_IN_SECONDS;
console.log({ CUSTOM_CONTEST_DURATION_IN_SECONDS });

const SignTransactionsStep = ({
  onSetLaunchContestStep,
  contestFormData,
  onSetCreatedContestAddress,
  fundingTokenTicker,
  fundingTokenDecimals,
}: SignTransactionsStepProps) => {
  const [launchContestData, setLaunchContestData] = useState({
    state: 'not-started' as ActionStepProps['state'],
    errorText: '',
  });

  const [configureNominationsData, setConfigureNominationsData] = useState({
    state: 'not-started' as ActionStepProps['state'],
    errorText: '',
  });

  const { stakeData } = useCommunityStake();

  const { mutateAsync: deployRecurringContestOnchainMutation } =
    useDeployRecurringContestOnchainMutation();
  const { mutateAsync: deploySingleERC20ContestOnchainMutation } =
    useDeploySingleERC20ContestOnchainMutation();
  const { mutateAsync: deploySingleJudgedContestOnchainMutation } =
    useDeploySingleJudgedContestOnchainMutation();
  const { mutateAsync: configureNominationsMutation } =
    useConfigureNominationsMutation();

  const { mutateAsync: createContestMutation } = useCreateContestMutation();
  const { data: judgeStatus } = useGetJudgeStatusQuery(app.activeChainId());

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
  const judgedContest = isJudgedContest(contestFormData?.contestTopic);

  const namespaceName = app?.chain?.meta?.namespace || '';
  const ethChainId = app?.chain?.meta?.ChainNode?.eth_chain_id || 0;
  const chainRpc = app?.chain?.meta?.ChainNode?.url || '';
  const walletAddress = user.activeAccount?.address || '';

  const signTransaction = async () => {
    const contestLength = devContest
      ? CUSTOM_CONTEST_DURATION_IN_SECONDS
      : contestFormData?.contestDuration || 0;

    const stakeId = stakeData?.stake?.stake_id || 0;
    const voterShare = commonProtocol.CONTEST_VOTER_SHARE;
    const feeShare = commonProtocol.CONTEST_FEE_SHARE;
    const weight = stakeData?.stake?.vote_weight || 0;
    const contestInterval = devContest
      ? CUSTOM_CONTEST_DURATION_IN_SECONDS
      : contestFormData?.contestDuration;
    const prizeShare = contestFormData?.prizePercentage;
    const exchangeToken = isDirectDepositSelected
      ? contestFormData?.fundingTokenAddress || ZERO_ADDRESS
      : stakeData?.stake?.stake_token;
    const winnerShares = contestFormData?.payoutStructure;
    const voteToken = contestFormData?.isFarcasterContest
      ? exchangeToken
      : contestFormData?.contestTopic?.tokenAddress;

    const singleERC20 = {
      ethChainId,
      chainRpc,
      namespaceName,
      contestInterval: contestLength,
      winnerShares,
      voteToken,
      voterShare,
      walletAddress,
      exchangeToken,
    } as DeploySingleERC20ContestOnchainProps;

    const judgeId = (judgeStatus?.current_judge_id || 100) + 1;

    const singleJudged = {
      ethChainId,
      chainRpc,
      namespaceName,
      contestInterval: contestLength,
      winnerShares,
      voterShare,
      walletAddress,
      exchangeToken,
      judgeId,
    } as DeploySingleJudgedContestOnchainProps;

    const recurring = {
      ethChainId,
      chainRpc,
      namespaceName,
      contestInterval: contestInterval || 0,
      winnerShares: winnerShares || [],
      stakeId,
      prizeShare,
      voterShare,
      feeShare,
      weight,
      walletAddress: walletAddress || '',
    };

    let contestAddress: string;

    try {
      setLaunchContestData((prevState) => ({
        ...prevState,
        state: 'loading',
      }));

      if (isContestRecurring) {
        contestAddress = await deployRecurringContestOnchainMutation(recurring);
      } else if (judgedContest) {
        contestAddress =
          await deploySingleJudgedContestOnchainMutation(singleJudged);
      } else {
        contestAddress =
          await deploySingleERC20ContestOnchainMutation(singleERC20);
      }

      await createContestMutation({
        contest_address: contestAddress,
        name: contestFormData?.contestName,
        description: contestFormData?.contestDescription,
        community_id: app.activeChainId() || '',
        image_url: contestFormData?.contestImage,
        funding_token_address: exchangeToken,
        prize_percentage: isContestRecurring
          ? contestFormData?.prizePercentage
          : 0,
        payout_structure: contestFormData?.payoutStructure,
        interval: isContestRecurring ? contestInterval! : 0,
        topic_id: contestFormData?.contestTopic?.value as number,
        ticker: fundingTokenTicker,
        is_farcaster_contest: contestFormData.isFarcasterContest,
        decimals: fundingTokenDecimals,
        vote_weight_multiplier: contestFormData.voteWeightMultiplier,
        namespace_judge_token_id: judgedContest ? singleJudged.judgeId : null,
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

  const configureNominations = async () => {
    try {
      setConfigureNominationsData((prevState) => ({
        ...prevState,
        state: 'loading',
      }));

      const judgeId = (judgeStatus?.current_judge_id || 100) + 1;

      await configureNominationsMutation({
        namespaceName,
        creatorOnly: true,
        walletAddress,
        maxNominations: 5,
        ethChainId,
        chainRpc,
        judgeId,
      });

      setConfigureNominationsData((prevState) => ({
        ...prevState,
        state: 'completed',
      }));
    } catch (error) {
      console.log('Error configuring nominations', error);
      setConfigureNominationsData((prevState) => ({
        ...prevState,
        state: 'not-started',
        errorText: 'Failed to configure nominations. Please try again.',
      }));
    }
  };

  const handleBack = () => {
    onSetLaunchContestStep('DetailsForm');
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

        <ActionSteps
          steps={getActionSteps({
            isJudgedContest: judgedContest,
            configureNominationsData,
            configureNominations,
            isDirectDepositSelected,
            launchContestData,
            signTransaction,
          })}
        />

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
