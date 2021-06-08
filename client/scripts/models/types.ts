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
  EdgewareTestnet = 'edgeware-testnet',
  Kusama = 'kusama',
  Kulupu = 'kulupu',
  Polkadot = 'polkadot',
  Plasm = 'plasm',
  Stafi = 'stafi',
  Darwinia = 'darwinia',
  Phala = 'phala',
  Centrifuge = 'centrifuge',
  Cosmos = 'cosmos',
  Straightedge = 'straightedge',
  Ethereum = 'ethereum',
  NEAR = 'near',
  Moloch = 'moloch',
  Marlin = 'marlin',
  MarlinTestnet = 'marlin-testnet',
  Metacartel = 'metacartel',
  ALEX = 'alex',
  Commonwealth = 'commonwealth',
  ERC20 = 'erc20',
  Clover = 'clover',
  HydraDX = 'hydradx',
  Crust = 'crust',
}

// This function returns a default chain for a chainbase
export function baseToNetwork(n: ChainBase): ChainNetwork {
  switch (n) {
    case ChainBase.CosmosSDK: return ChainNetwork.Cosmos;
    case ChainBase.Substrate: return ChainNetwork.Edgeware;
    case ChainBase.Ethereum: return ChainNetwork.Ethereum;
    case ChainBase.NEAR: return ChainNetwork.NEAR;
    default: return null;
  }
}

// TODO: this should be deprecated, and replaced with ChainNetwork in most instances
export enum ChainClass {
  Clover = 'clover',
  Edgeware = 'edgeware',
  EdgewareTestnet = 'edgeware-testnet',
  HydraDX = 'hydradx',
  Kusama = 'kusama',
  Kulupu = 'kulupu',
  Polkadot = 'polkadot',
  Plasm = 'plasm',
  Stafi = 'stafi',
  Darwinia = 'darwinia',
  Phala = 'phala',
  Centrifuge = 'centrifuge',
  CosmosHub = 'cosmos-hub',
  Gaia13k = 'gaia-13k',
  Straightedge = 'straightedge',
  Ethereum = 'ethereum',
  Near = 'near',
  Moloch = 'moloch',
  Marlin = 'marlin',
  MarlinTestnet = 'marlin-testnet',
  ALEX = 'alex',
  Commonwealth = 'commonwealth',
  Crust = 'crust',
  ERC20 = 'erc20',
}

// TODO: this is inconsistently used
export enum OffchainThreadKind {
  Forum = 'forum',
  Link = 'link',
  Question = 'question',
  Request = 'request',
}

export enum OffchainThreadStage {
  Discussion = 'discussion',
  ProposalInReview = 'proposal_in_review',
  Voting = 'voting',
  Passed = 'passed',
  Failed = 'failed',
}

export enum OffchainVoteOptions {
  SUPPORT_2,
  SUPPORT,
  NEUTRAL_SUPPORT,
  NEUTRAL_OPPOSE,
  OPPOSE,
  OPPOSE_2,
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
  Canceled = 'canceled',
  Passed = 'passed',
  Failed = 'failed',
  None = 'none',
}

export enum BountyStatus {
  Proposed = 'proposed',
  Approved = 'approved',
  Funded = 'funded',
  CuratorProposed = 'curator_proposed',
  Active = 'active',
  PendingPayout = 'pending_payout',
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
  MarlinYesNo = 'marlin',
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
