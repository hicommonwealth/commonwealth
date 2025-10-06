import { VoteGovernanceAbi } from '@commonxyz/common-governance-abis';
import {
  CommunityNominationsAbi,
  CommunityStakeAbi,
  ContestGovernorAbi,
  ContestGovernorSingleAbi,
  LPBondingCurveAbi,
  NamespaceFactoryAbi,
  ReferralFeeManagerAbi,
  TokenCommunityManagerAbi,
} from '@commonxyz/common-protocol-abis';
import {
  EvmEventSignatures,
  decodeLog,
  getEvmAddress,
} from '@hicommonwealth/evm-protocols';
import { OutboxEvents } from '@hicommonwealth/schemas';
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
    transaction_hash: event.rawLog.transactionHash,
    eth_chain_id: event.eventSource.ethChainId,
  };

  return decoded.args.oneOff
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
    !('quest_action_meta_ids' in event.meta) ||
    !event.meta.quest_action_meta_ids
  ) {
    throw new Error('Custom XP chain event is missing quest action meta id');
  }

  return {
    event_name: 'XpChainEventCreated',
    event_payload: {
      eth_chain_id: event.eventSource.ethChainId,
      quest_action_meta_ids: event.meta.quest_action_meta_ids,
      transaction_hash: event.rawLog.transactionHash,
      created_at: new Date(Number(event.block.timestamp) * 1_000),
    },
  };
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
  return {
    event_name: 'NominatorSettled',
    event_payload: {
      ...event,
      parsedArgs: decoded.args,
    },
  };
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
  return {
    event_name: 'NominatorNominated',
    event_payload: {
      ...event,
      parsedArgs: decoded.args,
    },
  };
};

const judgeNominatedMapper: EvmMapper<'JudgeNominated'> = (event: EvmEvent) => {
  const decoded = decodeLog({
    abi: CommunityNominationsAbi,
    eventName: 'JudgeNominated',
    data: event.rawLog.data,
    topics: event.rawLog.topics,
  });
  return {
    event_name: 'JudgeNominated',
    event_payload: {
      ...event,
      parsedArgs: decoded.args,
    },
  };
};

const communityNamespaceCreatedMapper: EvmMapper<
  'CommunityNamespaceCreated'
> = (event: EvmEvent) => {
  const decoded = decodeLog({
    abi: TokenCommunityManagerAbi,
    eventName: 'CommunityNamespaceCreated',
    data: event.rawLog.data,
    topics: event.rawLog.topics,
  });

  const { name, token, namespaceAddress, governanceAddress } = decoded.args;
  return {
    event_name: 'CommunityNamespaceCreated',
    event_payload: {
      name,
      token,
      namespaceAddress,
      governanceAddress,
    },
  };
};

const cmnOzProposalCreatedMapper: EvmMapper<'CmnOzProposalCreated'> = (
  event: EvmEvent,
) => {
  const decoded = decodeLog({
    abi: VoteGovernanceAbi,
    eventName: 'ProposalCreated',
    data: event.rawLog.data,
    topics: event.rawLog.topics,
  });

  // Will never happen - this is just here for type narrowing because
  // the ABI has 2 events with the same 'ProposalCreated' name.
  if (!('voteStart' in decoded.args))
    throw new Error(
      'CmnOzProposalCreatedMapper cannot process non-OZ proposal events',
    );

  const {
    proposalId,
    proposer: proposerAddress,
    description,
    voteStart: voteStartTimestamp,
    voteEnd: voteEndTimestamp,
  } = decoded.args;

  return {
    event_name: 'CmnOzProposalCreated',
    event_payload: {
      ...event,
      parsedArgs: {
        proposalId,
        proposerAddress,
        description,
        voteStartTimestamp,
        voteEndTimestamp,
      },
    },
  };
};

const cmnTokenVoteCastMapper: EvmMapper<'CmnTokenVoteCast'> = (
  event: EvmEvent,
) => {
  const decoded = decodeLog({
    abi: VoteGovernanceAbi,
    eventName: 'TokenVoteCast',
    data: event.rawLog.data,
    topics: event.rawLog.topics,
  });

  return {
    event_name: 'CmnTokenVoteCast',
    event_payload: {
      ...event,
      parsedArgs: decoded.args,
    },
  };
};

const cmnAddressVoteCastMapper: EvmMapper<'CmnAddressVoteCast'> = (
  event: EvmEvent,
) => {
  const decoded = decodeLog({
    abi: VoteGovernanceAbi,
    eventName: 'AddressVoteCast',
    data: event.rawLog.data,
    topics: event.rawLog.topics,
  });
  const { proposalId, voter: voterAddress, support } = decoded.args;

  return {
    event_name: 'CmnAddressVoteCast',
    event_payload: {
      ...event,
      parsedArgs: {
        proposalId,
        voterAddress,
        support,
      },
    },
  };
};

// TODO: type should match EventRegistry event signatures
export const chainEventMappers: Record<string, EvmMapper<OutboxEvents>> = {
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

  // TokenCommunityManager
  [EvmEventSignatures.TokenCommunityManager.CommunityNamespaceCreated]:
    communityNamespaceCreatedMapper,

  // Common VoteGovernance
  [EvmEventSignatures.VoteGovernance.OzProposalCreated]:
    cmnOzProposalCreatedMapper,
  [EvmEventSignatures.VoteGovernance.TokenVoteCast]: cmnTokenVoteCastMapper,
  [EvmEventSignatures.VoteGovernance.AddressVoteCast]: cmnAddressVoteCastMapper,

  // User defined events (no hardcoded event signatures)
  XpChainEventCreated: xpChainEventCreatedMapper,
};
