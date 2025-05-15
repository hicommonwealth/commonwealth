import {
  CommunityNominationsAbi,
  CommunityStakeAbi,
  ContestGovernorAbi,
  ContestGovernorSingleAbi,
  LPBondingCurveAbi,
  NamespaceFactoryAbi,
  ReferralFeeManagerAbi,
} from '@commonxyz/common-protocol-abis';
import {
  EvmEventSignatures,
  decodeLog,
  getErc20TokenInfo,
  getEvmAddress,
  getLaunchpadTokenCreatedTransaction,
  getTransactionSender,
} from '@hicommonwealth/evm-protocols';
import { models } from '@hicommonwealth/model';
import { Events } from '@hicommonwealth/schemas';
import { EvmEvent, EvmMapper } from './types';

const stakeTradeMapper: EvmMapper<'CommunityStakeTrade'> = (
  event: EvmEvent,
) => {
  const decoded = decodeLog({
    abi: CommunityStakeAbi,
    eventName: 'Trade',
    data: event.rawLog.data,
    topics: event.rawLog.topics,
  });
  return Promise.resolve({
    event_name: 'CommunityStakeTrade',
    event_payload: {
      ...event,
      parsedArgs: decoded.args,
    },
  });
};

const namespaceDeployedMapper: EvmMapper<'NamespaceDeployed'> = (
  event: EvmEvent,
) => {
  const decoded = decodeLog({
    abi: NamespaceFactoryAbi,
    eventName: 'DeployedNamespace',
    data: event.rawLog.data,
    topics: event.rawLog.topics,
  });
  return Promise.resolve({
    event_name: 'NamespaceDeployed',
    event_payload: {
      ...event,
      parsedArgs: decoded.args,
    },
  });
};

const referralNamespaceDeployedMapper: EvmMapper<
  'NamespaceDeployedWithReferral'
> = (event: EvmEvent) => {
  const decoded = decodeLog({
    abi: NamespaceFactoryAbi,
    eventName: 'DeployedNamespaceWithReferral',
    data: event.rawLog.data,
    topics: event.rawLog.topics,
  });
  return Promise.resolve({
    event_name: 'NamespaceDeployedWithReferral',
    event_payload: {
      ...event,
      parsedArgs: decoded.args,
    },
  });
};

const launchpadTokenCreatedMapper: EvmMapper<'LaunchpadTokenCreated'> = async (
  event: EvmEvent,
) => {
  const chainNode = await models.ChainNode.findOne({
    where: { eth_chain_id: event.eventSource.ethChainId },
  });
  if (!chainNode) throw Error('Chain node not found', { cause: event });

  const tokenData = await getLaunchpadTokenCreatedTransaction({
    rpc: chainNode.private_url! || chainNode.url!,
    transactionHash: event.rawLog.transactionHash,
  });
  if (!tokenData) throw Error('Token data not found', { cause: event });

  let tokenInfo: { name: string; symbol: string; totalSupply: bigint };
  try {
    tokenInfo = await getErc20TokenInfo({
      rpc: chainNode.private_url || chainNode.url,
      tokenAddress: tokenData.parsedArgs.tokenAddress,
    });
  } catch (e) {
    throw Error(
      `Failed to get erc20 token properties for token ${tokenData.parsedArgs.tokenAddress}`,
    );
  }

  const sender = await getTransactionSender(
    chainNode.private_url || chainNode.url,
    event.rawLog.transactionHash,
  );
  if (!sender)
    throw Error('Failed to get transaction sender', { cause: event });

  return {
    event_name: 'LaunchpadTokenCreated',
    event_payload: {
      block_timestamp: event.block.timestamp,
      transaction_hash: event.rawLog.transactionHash,
      eth_chain_id: event.eventSource.ethChainId,
      creator_address: sender as `0x${string}`,
      token_address: tokenData.parsedArgs.tokenAddress as `0x${string}`,
      namespace: tokenData.parsedArgs.namespace,
      curve_id: tokenData.parsedArgs.curveId,
      total_supply: tokenData.parsedArgs.totalSupply,
      launchpad_liquidity: tokenData.parsedArgs.launchpadLiquidity,
      reserve_ration: tokenData.parsedArgs.reserveRation,
      initial_purchase_eth_amount:
        tokenData.parsedArgs.initialPurchaseEthAmount,
      name: tokenInfo.name,
      symbol: tokenInfo.symbol,
    },
  };
};

const launchpadTradeMapper: EvmMapper<'LaunchpadTokenTraded'> = (
  event: EvmEvent,
) => {
  const decoded = decodeLog({
    abi: LPBondingCurveAbi,
    eventName: 'Trade',
    data: event.rawLog.data,
    topics: event.rawLog.topics,
  });
  return Promise.resolve({
    event_name: 'LaunchpadTokenTraded',
    event_payload: {
      block_timestamp: event.block.timestamp,
      transaction_hash: event.rawLog.transactionHash,
      trader_address: decoded.args.trader,
      token_address: decoded.args.tokenAddress,
      is_buy: decoded.args.isBuy,
      eth_chain_id: event.eventSource.ethChainId,
      eth_amount: decoded.args.ethAmount,
      community_token_amount: decoded.args.tokenAmount,
      floating_supply: decoded.args.floatingSupply,
    },
  });
};

const referralFeeDistributed: EvmMapper<'ReferralFeeDistributed'> = (
  event: EvmEvent,
) => {
  const decoded = decodeLog({
    abi: ReferralFeeManagerAbi,
    eventName: 'FeesDistributed',
    data: event.rawLog.data,
    topics: event.rawLog.topics,
  });
  return Promise.resolve({
    event_name: 'ReferralFeeDistributed',
    event_payload: {
      ...event,
      parsedArgs: decoded.args,
    },
  });
};

const contestManagerDeployedMapper: EvmMapper<
  'RecurringContestManagerDeployed' | 'OneOffContestManagerDeployed'
> = (event: EvmEvent) => {
  const decoded = decodeLog({
    abi: NamespaceFactoryAbi,
    eventName: 'NewContest',
    data: event.rawLog.data,
    topics: event.rawLog.topics,
  });
  const { contest: contest_address, namespace, interval } = decoded.args;
  const event_payload = {
    namespace: namespace as string,
    contest_address: contest_address as string,
    block_number: Number(event.block.number),
    transaction_hash: event.rawLog.transactionHash,
    eth_chain_id: event.eventSource.ethChainId,
  };

  return Promise.resolve(
    decoded.args.oneOff
      ? {
          event_name: 'OneOffContestManagerDeployed',
          event_payload: {
            ...event_payload,
            length: Number(interval),
          },
        }
      : {
          event_name: 'RecurringContestManagerDeployed',
          event_payload: {
            ...event_payload,
            interval: Number(interval),
          },
        },
  );
};

const recurringContestStartedMapper: EvmMapper<'ContestStarted'> = (
  event: EvmEvent,
) => {
  const decoded = decodeLog({
    abi: ContestGovernorAbi,
    eventName: 'NewRecurringContestStarted',
    data: event.rawLog.data,
    topics: event.rawLog.topics,
  });
  return Promise.resolve({
    event_name: 'ContestStarted',
    event_payload: {
      contest_address: getEvmAddress(event.rawLog.address),
      contest_id: Number(decoded.args.contestId),
      start_time: new Date(Number(decoded.args.startTime) * 1000),
      end_time: new Date(Number(decoded.args.endTime) * 1000),
      is_one_off: false,
    },
  });
};

const singleContestStartedMapper: EvmMapper<'ContestStarted'> = (
  event: EvmEvent,
) => {
  const decoded = decodeLog({
    abi: ContestGovernorSingleAbi,
    eventName: 'NewSingleContestStarted',
    data: event.rawLog.data,
    topics: event.rawLog.topics,
  });
  return Promise.resolve({
    event_name: 'ContestStarted',
    event_payload: {
      contest_address: getEvmAddress(event.rawLog.address),
      contest_id: 0,
      start_time: new Date(Number(decoded.args.startTime) * 1000),
      end_time: new Date(Number(decoded.args.endTime) * 1000),
      is_one_off: true,
    },
  });
};

const contestContentAddedMapper: EvmMapper<'ContestContentAdded'> = (
  event: EvmEvent,
) => {
  const decoded = decodeLog({
    abi: ContestGovernorAbi,
    eventName: 'ContentAdded',
    data: event.rawLog.data,
    topics: event.rawLog.topics,
  });
  return Promise.resolve({
    event_name: 'ContestContentAdded',
    event_payload: {
      contest_address: getEvmAddress(event.rawLog.address),
      content_id: Number(decoded.args.contentId),
      creator_address: decoded.args.creator,
      content_url: decoded.args.url,
    },
  });
};

const recurringContestVoteMapper: EvmMapper<'ContestContentUpvoted'> = (
  event: EvmEvent,
) => {
  const decoded = decodeLog({
    abi: ContestGovernorAbi,
    eventName: 'VoterVoted',
    data: event.rawLog.data,
    topics: event.rawLog.topics,
  });
  const {
    contestId,
    contentId,
    voter: voter_address,
    votingPower,
  } = decoded.args;
  return Promise.resolve({
    event_name: 'ContestContentUpvoted',
    event_payload: {
      contest_address: getEvmAddress(event.rawLog.address),
      contest_id: Number(contestId),
      content_id: Number(contentId),
      voter_address,
      voting_power: votingPower.toString(),
    },
  });
};

const singleContestVoteMapper: EvmMapper<'ContestContentUpvoted'> = (
  event: EvmEvent,
) => {
  const decoded = decodeLog({
    abi: ContestGovernorSingleAbi,
    eventName: 'VoterVoted',
    data: event.rawLog.data,
    topics: event.rawLog.topics,
  });
  const { contentId, voter: voter_address, votingPower } = decoded.args;
  return Promise.resolve({
    event_name: 'ContestContentUpvoted',
    event_payload: {
      contest_address: getEvmAddress(event.rawLog.address),
      contest_id: 0,
      content_id: Number(contentId),
      voter_address,
      voting_power: votingPower.toString(),
    },
  });
};

const xpChainEventCreatedMapper: EvmMapper<'XpChainEventCreated'> = (
  event: EvmEvent,
) => {
  if (
    !('quest_action_meta_ids' in event.meta) ||
    !event.meta.quest_action_meta_ids
  ) {
    throw new Error('Custom XP chain event is missing quest action meta id');
  }

  return Promise.resolve({
    event_name: 'XpChainEventCreated',
    event_payload: {
      eth_chain_id: event.eventSource.ethChainId,
      quest_action_meta_ids: event.meta.quest_action_meta_ids,
      transaction_hash: event.rawLog.transactionHash,
      created_at: new Date(Number(event.block.timestamp) * 1_000),
    },
  });
};

const nominatorSettledMapper: EvmMapper<'NominatorSettled'> = (
  event: EvmEvent,
) => {
  const decoded = decodeLog({
    abi: CommunityNominationsAbi,
    eventName: 'NominatorSettled',
    data: event.rawLog.data,
    topics: event.rawLog.topics,
  });
  return Promise.resolve({
    event_name: 'NominatorSettled',
    event_payload: {
      ...event,
      parsedArgs: decoded.args,
    },
  });
};

const nominatorNominatedMapper: EvmMapper<'NominatorNominated'> = (
  event: EvmEvent,
) => {
  const decoded = decodeLog({
    abi: CommunityNominationsAbi,
    eventName: 'NominatorNominated',
    data: event.rawLog.data,
    topics: event.rawLog.topics,
  });
  return Promise.resolve({
    event_name: 'NominatorNominated',
    event_payload: {
      ...event,
      parsedArgs: decoded.args,
    },
  });
};

const judgeNominatedMapper: EvmMapper<'JudgeNominated'> = (event: EvmEvent) => {
  const decoded = decodeLog({
    abi: CommunityNominationsAbi,
    eventName: 'JudgeNominated',
    data: event.rawLog.data,
    topics: event.rawLog.topics,
  });
  return Promise.resolve({
    event_name: 'JudgeNominated',
    event_payload: {
      ...event,
      parsedArgs: decoded.args,
    },
  });
};

// TODO: type should match EventRegistry event signatures
export const chainEventMappers: Record<string, EvmMapper<Events>> = {
  [EvmEventSignatures.NamespaceFactory.NamespaceDeployed]:
    namespaceDeployedMapper,

  // Stake
  [EvmEventSignatures.CommunityStake.Trade]: stakeTradeMapper,

  // Launchpad
  [EvmEventSignatures.Launchpad.TokenLaunched]: launchpadTokenCreatedMapper,
  [EvmEventSignatures.Launchpad.Trade]: launchpadTradeMapper,

  // Referrals
  [EvmEventSignatures.Referrals.FeeDistributed]: referralFeeDistributed,
  [EvmEventSignatures.NamespaceFactory.NamespaceDeployedWithReferral]:
    referralNamespaceDeployedMapper,

  // Namespace Factory
  [EvmEventSignatures.NamespaceFactory.ContestManagerDeployed]:
    contestManagerDeployedMapper,

  // Community Nominations
  [EvmEventSignatures.CommunityNominations.NominatorSettled]:
    nominatorSettledMapper,
  [EvmEventSignatures.CommunityNominations.NominatorNominated]:
    nominatorNominatedMapper,
  [EvmEventSignatures.CommunityNominations.JudgeNominated]:
    judgeNominatedMapper,

  // Contests
  [EvmEventSignatures.Contests.RecurringContestStarted]:
    recurringContestStartedMapper,
  [EvmEventSignatures.Contests.SingleContestStarted]:
    singleContestStartedMapper,
  [EvmEventSignatures.Contests.ContentAdded]: contestContentAddedMapper,
  [EvmEventSignatures.Contests.RecurringContestVoterVoted]:
    recurringContestVoteMapper,
  [EvmEventSignatures.Contests.SingleContestVoterVoted]:
    singleContestVoteMapper,

  // User defined events (no hardcoded event signatures)
  XpChainEventCreated: xpChainEventCreatedMapper,
};
