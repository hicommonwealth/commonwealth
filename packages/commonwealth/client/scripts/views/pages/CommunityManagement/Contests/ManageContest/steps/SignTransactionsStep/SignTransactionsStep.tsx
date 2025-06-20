import { commonProtocol } from '@hicommonwealth/evm-protocols';
import { ChainBase, ZERO_ADDRESS } from '@hicommonwealth/shared';
import { useGetCommunityByIdQuery } from 'client/scripts/state/api/communities';
import useGetJudgeStatusQuery from 'client/scripts/state/api/contests/getJudgeStatus';
import useAppStatus from 'hooks/useAppStatus';
import { useBrowserAnalyticsTrack } from 'hooks/useBrowserAnalyticsTrack';
import { useFlag } from 'hooks/useFlag';
import React, { useMemo, useState } from 'react';
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
  useDeploySolanaContestOnchainMutation,
  useNominateJudgesMutation,
} from 'state/api/contests';
import { DeploySingleERC20ContestOnchainProps } from 'state/api/contests/deploySingleERC20ContestOnchain';
import { DeploySingleJudgedContestOnchainProps } from 'state/api/contests/deploySingleJudgedContestOnchain';
import { DeploySolanaContestOnchainProps } from 'state/api/contests/deploySolanaContestOnchain';
import { useFetchTopicsQuery } from 'state/api/topics';
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

  const [nominateSelfData, setNominateSelfData] = useState({
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
  const { mutateAsync: deploySolanaContestOnchainMutation } =
    useDeploySolanaContestOnchainMutation();
  const { mutateAsync: configureNominationsMutation } =
    useConfigureNominationsMutation();

  const { mutateAsync: nominateJudges } = useNominateJudgesMutation();

  const { mutateAsync: createContestMutation } = useCreateContestMutation();
  const { data: judgeStatus } = useGetJudgeStatusQuery(app.activeChainId());

  const user = useUserStore();

  const communityId = app.activeChainId() || '';
  const { data: community } = useGetCommunityByIdQuery({
    id: communityId,
    enabled: !!communityId,
  });

  // Fetch topics data if not already in contestFormData
  const { data: topicsData } = useFetchTopicsQuery({
    communityId,
    apiEnabled:
      !!communityId &&
      (!contestFormData.topicsData || contestFormData.topicsData.length === 0),
  });

  // Combine topicsData from the form (if it exists) or from the API fetch
  const combinedTopicsData = contestFormData.topicsData || topicsData || [];

  const { isAddedToHomeScreen } = useAppStatus();

  const { trackAnalytics } = useBrowserAnalyticsTrack<BaseMixpanelPayload>({
    onAction: true,
  });

  const namespaceName = app?.chain?.meta?.namespace || '';
  const ethChainId = app?.chain?.meta?.ChainNode?.eth_chain_id || 0;
  const chainRpc = app?.chain?.meta?.ChainNode?.url || '';
  const walletAddress = user.activeAccount?.address || '';
  const chainBase = app?.chain?.base || '';
  const isSolanaChain = chainBase === ChainBase.Solana;

  const isContestRecurring =
    !isSolanaChain &&
    contestFormData.contestRecurring === ContestRecurringType.Yes;
  const isDirectDepositSelected =
    contestFormData.feeType === ContestFeeType.DirectDeposit;
  const devContest = useFlag('contestDev');
  const judgedContest = isJudgedContest(contestFormData?.contestTopic);

  const judgeIdToUse = useMemo(() => {
    if (judgedContest && community?.pending_namespace_judge_token_id) {
      return community.pending_namespace_judge_token_id;
    }
    return (judgeStatus?.current_judge_id || 100) + 1;
  }, [
    judgedContest,
    community?.pending_namespace_judge_token_id,
    judgeStatus?.current_judge_id,
  ]);

  const getExchangeToken = () => {
    if (isSolanaChain) {
      // For Solana, first try to use the token address from the selected topic
      const topicTokenAddress = contestFormData?.contestTopic?.tokenAddress;

      // For Solana, we need a valid token address
      if (topicTokenAddress) {
        // If we have a token address from the topic, use that first
        return topicTokenAddress;
      } else if (isDirectDepositSelected) {
        // Otherwise fallback to funding token address if direct deposit
        return contestFormData?.fundingTokenAddress;
    } else {
      // For Ethereum, use the original logic
      return isDirectDepositSelected
        ? contestFormData?.fundingTokenAddress || ZERO_ADDRESS
        : stakeData?.stake?.stake_token;
    }
  };

  const exchangeToken = getExchangeToken();

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

    const singleJudged = {
      ethChainId,
      chainRpc,
      namespaceName,
      contestInterval: contestLength,
      winnerShares,
      voterShare,
      walletAddress,
      exchangeToken,
      judgeId: judgeIdToUse,
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

    // Ensure we have a valid prize mint address - prioritize token from topic if available
    const topicTokenAddress = contestFormData?.contestTopic?.tokenAddress;
    const prizeMintToUse = topicTokenAddress || exchangeToken;

    const solanaContest = {
      connectionUrl: chainRpc,
      prizeMint: prizeMintToUse, // Prioritize topic token address
      protocolFeeDestination: walletAddress, // Use admin wallet as fee destination for now
      contestLengthSeconds: contestLength,
      // Convert percentages (0-100) to basis points (0-10000) for Solana contract
      winnerShares:
        winnerShares && winnerShares.length > 0
          ? winnerShares.map((share) => share * 100) // Convert from percentages to basis points
          : [10000],
      protocolFeePercentage: 1000, // 10% fee in basis points
      authority: walletAddress,
      // Adding a random seed to ensure uniqueness
      seed: Math.floor(Math.random() * 256),
    } as DeploySolanaContestOnchainProps;

    let contestAddress: string;

    try {
      setLaunchContestData((prevState) => ({
        ...prevState,
        state: 'loading',
      }));

      // For Solana communities, always use the Solana contest deployment
      if (isSolanaChain) {
            await deploySolanaContestOnchainMutation(solanaContest);
          contestAddress = result.contestPda;;
        }
      } else if (isContestRecurring) {
        contestAddress = await deployRecurringContestOnchainMutation(recurring);
      } else if (judgedContest) {
        contestAddress =
          await deploySingleJudgedContestOnchainMutation(singleJudged);
      } else {
        contestAddress =
          await deploySingleERC20ContestOnchainMutation(singleERC20);
      }
      // Get token symbol from the topic for Solana contests
      const topicId = contestFormData?.contestTopic?.value as number;
      const selectedTopic = combinedTopicsData.find((t) => t.id === topicId);

      await createContestMutation({
        contest_address: contestAddress,
        name: contestFormData?.contestName,
        description: contestFormData?.contestDescription,
        community_id: app.activeChainId() || '',
        image_url: contestFormData?.contestImage,
        // For Solana contests, ensure we use the token address from the contest topic if available
        funding_token_address:
          isSolanaChain && contestFormData?.contestTopic?.tokenAddress
            ? contestFormData.contestTopic.tokenAddress
            : exchangeToken,
        prize_percentage: isContestRecurring
          ? contestFormData?.prizePercentage
          : 0,
        payout_structure: contestFormData?.payoutStructure,
        interval: isSolanaChain ? 0 : isContestRecurring ? contestInterval! : 0,
        topic_id: topicId,
        ticker: isSolanaChain && selectedTopic?.token_symbol
          ? selectedTopic.token_symbol
          : fundingTokenTicker,
        is_farcaster_contest: contestFormData.isFarcasterContest,
        decimals: isSolanaChain ? 9 : fundingTokenDecimals,
        vote_weight_multiplier: contestFormData.voteWeightMultiplier,
        namespace_judge_token_id:
          judgedContest && !isSolanaChain ? judgeIdToUse : null,
      });

      onSetLaunchContestStep('ContestLive');
      onSetCreatedContestAddress(contestAddress);
      trackAnalytics({
        event: MixpanelContestEvents.CONTEST_CREATED,
        isPWA: isAddedToHomeScreen,
      });
    } catch (error) {
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

      await configureNominationsMutation({
        namespaceName,
        creatorOnly: true,
        walletAddress,
        maxNominations: 5,
        ethChainId,
        chainRpc,
        judgeId: judgeIdToUse,
      });

      setConfigureNominationsData((prevState) => ({
        ...prevState,
        state: 'completed',
      }));
    } catch (error) {
      setConfigureNominationsData((prevState) => ({
        ...prevState,
        state: 'not-started',
        errorText: 'Failed to configure nominations. Please try again.',
      }));
    }
  };

  const nominateSelf = async () => {
    try {
      setNominateSelfData((prevState) => ({
        ...prevState,
        state: 'loading',
      }));

      if (!walletAddress) {
        throw new Error('Wallet Address Not Found');
      }

      await nominateJudges({
        namespace: namespaceName,
        judges: [walletAddress],
        judgeId: judgeIdToUse,
        walletAddress,
        ethChainId,
        chainRpc,
      });

      setNominateSelfData((prevState) => ({
        ...prevState,
        state: 'completed',
      }));
    } catch (error) {
      setNominateSelfData((prevState) => ({
        ...prevState,
        state: 'not-started',
        errorText: 'Failed to nominate self as judge. Please try again.',
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
          {isSolanaChain
            ? 'This will initialize a single Solana contest on-chain.'
            : isContestRecurring
              ? 'It routes the fees generated from stake to the contest address and launches the contest contract onchain.'
              : 'It launches the contest contract onchain.'}
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
            nominateSelfData,
            nominateSelf,
            isDirectDepositSelected,
            launchContestData,
            signTransaction,
            isSolanaChain,
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
