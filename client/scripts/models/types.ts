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
  Clover = 'clover',
  HydraDX = 'hydradx',
  Yearn = 'yearn',
  Fei = 'fei'
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

export function baseToLabel(n: ChainBase): string {
  switch (n) {
    case ChainBase.CosmosSDK: return 'Cosmos Wallet';
    case ChainBase.Substrate: return 'polkadot-js';
    case ChainBase.Ethereum: return 'Ethereum Wallet';
    case ChainBase.NEAR: return 'NEAR Wallet';
    default: return 'Wallet';
  }
}

export function networkToBase(n: ChainNetwork | string): ChainBase {
  switch (n) {
    case ChainNetwork.Clover: return ChainBase.Substrate;
    case ChainNetwork.Edgeware: return ChainBase.Substrate;
    case ChainNetwork.EdgewareTestnet: return ChainBase.Substrate;
    case ChainNetwork.Kusama: return ChainBase.Substrate;
    case ChainNetwork.Kulupu: return ChainBase.Substrate;
    case ChainNetwork.Polkadot: return ChainBase.Substrate;
    case ChainNetwork.Plasm: return ChainBase.Substrate;
    case ChainNetwork.Stafi: return ChainBase.Substrate;
    case ChainNetwork.Darwinia: return ChainBase.Substrate;
    case ChainNetwork.Phala: return ChainBase.Substrate;
    case ChainNetwork.Centrifuge: return ChainBase.Substrate;
    case ChainNetwork.HydraDX: return ChainBase.Substrate;
    case ChainNetwork.Cosmos: return ChainBase.CosmosSDK;
    case ChainNetwork.Straightedge: return ChainBase.CosmosSDK;
    case ChainNetwork.NEAR: return ChainBase.NEAR;
    case ChainNetwork.Ethereum: return ChainBase.Ethereum;
    case ChainNetwork.Moloch: return ChainBase.Ethereum;
    case ChainNetwork.Metacartel: return ChainBase.Ethereum;
    case ChainNetwork.Commonwealth: return ChainBase.Ethereum;
    case ChainNetwork.ALEX: return ChainBase.Ethereum;
    case ChainNetwork.Marlin: return ChainBase.Ethereum;
    case ChainNetwork.MarlinTestnet: return ChainBase.Ethereum;
    case ChainNetwork.Yearn: return ChainBase.Ethereum;
    case ChainNetwork.Fei: return ChainBase.Ethereum;
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
  Yearn = 'yearn',
  Fei = 'fei',
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
  Abandoned = 'abandoned',
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
