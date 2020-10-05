import {
  IFixedEndTime,
  IFixedBlockEndTime,
  IDynamicEndTime,
  IThresholdEndTime,
  INotStartedEndTime,
  IQueuedEndTime,
  IUnavailableEndTime
} from './interfaces';
import Proposal from './Proposal';

export enum ChainBase {
  CosmosSDK = 'cosmos',
  Substrate = 'substrate',
  Ethereum = 'ethereum',
  NEAR = 'near',
}

export enum ChainNetwork {
  Edgeware = 'edgeware',
  Kusama = 'kusama',
  Kulupu = 'kulupu',
  Polkadot = 'polkadot',
  Plasm = 'plasm',
  Stafi = 'stafi',
  Cosmos = 'cosmos',
  Ethereum = 'ethereum',
  NEAR = 'near',
  Moloch = 'moloch',
  Metacartel = 'metacartel',
}

// TODO: this should be deprecated, and replaced with ChainNetwork in most instances
export enum ChainClass {
  Edgeware = 'edgeware',
  Kusama = 'kusama',
  Kulupu = 'kulupu',
  Polkadot = 'polkadot',
  Plasm = 'plasm',
  Stafi = 'stafi',
  CosmosHub = 'cosmos-hub',
  Gaia13k = 'gaia-13k',
  Ethereum = 'ethereum',
  Near = 'near',
  Moloch = 'moloch',
}

// TODO: this is inconsistently used
export enum OffchainThreadKind {
  Forum = 'forum',
  Link = 'link',
  Question = 'question',
  Request = 'request',
}

export enum TransactionStatus {
  'Ready',
  'Success',
  'Failed',
  'Error',
}

export enum ProposalStatus {
  Passing = 'pass',
  Failing = 'fail',
  Passed = 'passed',
  Failed = 'failed',
  None = 'none',
}
export enum VotingType {
  SimpleYesNoVoting = 'binary',
  ConvictionYesNoVoting = 'binary_conviction',
  SimpleYesApprovalVoting = 'approval',
  YesNoAbstainVeto = 'yes_no_abstain_veto',
  RankedChoiceVoting = 'rankedchoice',
  MultiOptionVoting = 'multioption',
  None = 'none',
  MolochYesNo = 'moloch',
}
export enum VotingUnit {
  OnePersonOneVote = '1p1v',
  CoinVote = 'coin',
  ConvictionCoinVote = 'conviction_coin',
  None = 'none',
}

export type ProposalEndTime = IFixedEndTime | IFixedBlockEndTime | IDynamicEndTime | IThresholdEndTime |
  INotStartedEndTime | IQueuedEndTime | IUnavailableEndTime;

export type AnyProposal = Proposal<any, any, any, any>;
