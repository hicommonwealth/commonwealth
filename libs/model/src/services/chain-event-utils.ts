import {
  communityStakesAbi,
  decodeLog,
  EvmEventSignatures,
  getEvmAddress,
  lpBondingCurveAbi,
  namespaceFactoryAbi,
  recurringContestAbi,
  referralFeeManager,
  singleContestAbi,
} from '@hicommonwealth/evm-protocols';
import { EventPair, Events } from '@hicommonwealth/schemas';

export type EvmBlockDetails = {
  number: bigint;
  hash: string;
  logsBloom: string;
  nonce?: string;
  parentHash: string;
  timestamp: bigint;
  miner: string;
  gasLimit: bigint;
};

export type Log = {
  blockNumber: bigint;
  blockHash: string;
  transactionIndex: number;

  removed: boolean;

  address: string;
  data: string;

  topics: Array<string>;

  transactionHash: string;
  logIndex: number;
};

export type EvmEvent = {
  eventSource: {
    ethChainId: number;
    eventSignature: string;
  };
  rawLog: Log;
  block: EvmBlockDetails;
};

type EvmMapper<E extends Events> = (evmEvent: EvmEvent) => EventPair<E>;

const stakeTradeMapper: EvmMapper<'CommunityStakeTrade'> = (
  event: EvmEvent,
) => {
  const decoded = decodeLog<typeof communityStakesAbi, 'Trade'>({
    abi: communityStakesAbi,
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
  const decoded = decodeLog<typeof namespaceFactoryAbi, 'DeployedNamespace'>({
    abi: namespaceFactoryAbi,
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
  const decoded = decodeLog<
    typeof namespaceFactoryAbi,
    'DeployedNamespaceWithReferral'
  >({
    abi: namespaceFactoryAbi,
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
  const decoded = decodeLog<typeof lpBondingCurveAbi, 'Trade'>({
    abi: lpBondingCurveAbi,
    data: event.rawLog.data,
    topics: event.rawLog.topics,
  });
  return {
    event_name: 'LaunchpadTokenTraded',
    event_payload: {
      block_timestamp: event.block.timestamp,
      transaction_hash: event.rawLog.transactionHash,
      trader_address: decoded.args.trader,
      token_address: decoded.args.namespace,
      is_buy: decoded.args.isBuy,
      eth_chain_id: event.eventSource.ethChainId,
      eth_amount: decoded.args.ethAmount,
      community_token_amount: decoded.args.communityTokenAmount,
      floating_supply: decoded.args.floatingSupply,
    },
  };
};

const referralFeeDistributed: EvmMapper<'ReferralFeeDistributed'> = (
  event: EvmEvent,
) => {
  const decoded = decodeLog<typeof referralFeeManager, 'FeesDistributed'>({
    abi: referralFeeManager,
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
  const decoded = decodeLog<typeof namespaceFactoryAbi, 'NewContest'>({
    abi: namespaceFactoryAbi,
    data: event.rawLog.data,
    topics: event.rawLog.topics,
  });
  const { contest: contest_address, namespace, interval } = decoded.args;
  const event_payload = {
    contest_address: contest_address as string,
    namespace: namespace as string,
    length: Number(interval),
    block_number: Number(event.block.number),
  };

  if (decoded.args.oneOff) {
    return {
      event_name: 'OneOffContestManagerDeployed',
      event_payload,
    };
  }

  return {
    event_name: 'RecurringContestManagerDeployed',
    event_payload,
  };
};

const recurringContestStartedMapper: EvmMapper<'ContestStarted'> = (
  event: EvmEvent,
) => {
  const decoded = decodeLog<
    typeof recurringContestAbi,
    'NewRecurringContestStarted'
  >({
    abi: recurringContestAbi,
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
  const decoded = decodeLog<typeof singleContestAbi, 'NewSingleContestStarted'>(
    {
      abi: singleContestAbi,
      data: event.rawLog.data,
      topics: event.rawLog.topics,
    },
  );
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
  const decoded = decodeLog<typeof recurringContestAbi, 'ContentAdded'>({
    abi: recurringContestAbi,
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
  const decoded = decodeLog<typeof recurringContestAbi, 'VoterVoted'>({
    abi: recurringContestAbi,
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
  const decoded = decodeLog<typeof singleContestAbi, 'VoterVoted'>({
    abi: singleContestAbi,
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
};
