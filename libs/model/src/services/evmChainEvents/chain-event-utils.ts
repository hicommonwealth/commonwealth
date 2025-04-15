import {
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
  getEvmAddress,
} from '@hicommonwealth/evm-protocols';
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
  return {
    event_name: 'CommunityStakeTrade',
    event_payload: {
      ...event,
      parsedArgs: decoded.args,
    },
  };
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
  return {
    event_name: 'NamespaceDeployed',
    event_payload: {
      ...event,
      parsedArgs: decoded.args,
    },
  };
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
  return {
    event_name: 'NamespaceDeployedWithReferral',
    event_payload: {
      ...event,
      parsedArgs: decoded.args,
    },
  };
};

const launchpadTokenCreatedMapper: EvmMapper<'LaunchpadTokenCreated'> = (
  event: EvmEvent,
) => {
  return {
    event_name: 'LaunchpadTokenCreated',
    event_payload: {
      block_timestamp: event.block.timestamp,
      transaction_hash: event.rawLog.transactionHash,
      eth_chain_id: event.eventSource.ethChainId,
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
  return {
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
  };
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
  return {
    event_name: 'ReferralFeeDistributed',
    event_payload: {
      ...event,
      parsedArgs: decoded.args,
    },
  };
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
  };

  if (decoded.args.oneOff) {
    return {
      event_name: 'OneOffContestManagerDeployed',
      event_payload: {
        ...event_payload,
        length: Number(interval),
      },
    };
  }

  return {
    event_name: 'RecurringContestManagerDeployed',
    event_payload: {
      ...event_payload,
      interval: Number(interval),
    },
  };
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
  return {
    event_name: 'ContestStarted',
    event_payload: {
      contest_address: getEvmAddress(event.rawLog.address),
      contest_id: Number(decoded.args.contestId),
      start_time: new Date(Number(decoded.args.startTime) * 1000),
      end_time: new Date(Number(decoded.args.endTime) * 1000),
      is_one_off: false,
    },
  };
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
  return {
    event_name: 'ContestStarted',
    event_payload: {
      contest_address: getEvmAddress(event.rawLog.address),
      contest_id: 0,
      start_time: new Date(Number(decoded.args.startTime) * 1000),
      end_time: new Date(Number(decoded.args.endTime) * 1000),
      is_one_off: true,
    },
  };
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
  return {
    event_name: 'ContestContentAdded',
    event_payload: {
      contest_address: getEvmAddress(event.rawLog.address),
      content_id: Number(decoded.args.contentId),
      creator_address: decoded.args.creator,
      content_url: decoded.args.url,
    },
  };
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
  return {
    event_name: 'ContestContentUpvoted',
    event_payload: {
      contest_address: getEvmAddress(event.rawLog.address),
      contest_id: Number(contestId),
      content_id: Number(contentId),
      voter_address,
      voting_power: votingPower.toString(),
    },
  };
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
  return {
    event_name: 'ContestContentUpvoted',
    event_payload: {
      contest_address: getEvmAddress(event.rawLog.address),
      contest_id: 0,
      content_id: Number(contentId),
      voter_address,
      voting_power: votingPower.toString(),
    },
  };
};

const xpChainEventCreatedMapper: EvmMapper<'XpChainEventCreated'> = (
  event: EvmEvent,
) => {
  if (
    !('quest_action_meta_id' in event.meta) ||
    !event.meta.quest_action_meta_id
  ) {
    throw new Error('Custom XP chain event is missing quest action meta id');
  }

  return {
    event_name: 'XpChainEventCreated',
    event_payload: {
      eth_chain_id: event.eventSource.ethChainId,
      quest_action_meta_id: event.meta.quest_action_meta_id,
      transaction_hash: event.rawLog.transactionHash,
      created_at: new Date(Number(event.block.timestamp) * 1_000),
    },
  };
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

  // Contests
  [EvmEventSignatures.NamespaceFactory.ContestManagerDeployed]:
    contestManagerDeployedMapper,
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
