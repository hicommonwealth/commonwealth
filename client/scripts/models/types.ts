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
  Darwinia = 'darwinia',
  Phala = 'phala',
  Centrifuge = 'centrifuge',
  Cosmos = 'cosmos',
  Straightedge = 'straightedge',
  Ethereum = 'ethereum',
  NEAR = 'near',
  Moloch = 'moloch',
  Metacartel = 'metacartel',
  ALEX = 'alex',
  Commonwealth = 'commonwealth',
}

export function networkToBase(n: ChainNetwork): ChainBase {
  switch (n) {
    case ChainNetwork.Edgeware: return ChainBase.Substrate;
    case ChainNetwork.Kusama: return ChainBase.Substrate;
    case ChainNetwork.Kulupu: return ChainBase.Substrate;
    case ChainNetwork.Polkadot: return ChainBase.Substrate;
    case ChainNetwork.Plasm: return ChainBase.Substrate;
    case ChainNetwork.Stafi: return ChainBase.Substrate;
    case ChainNetwork.Darwinia: return ChainBase.Substrate;
    case ChainNetwork.Phala: return ChainBase.Substrate;
    case ChainNetwork.Centrifuge: return ChainBase.Substrate;
    case ChainNetwork.Cosmos: return ChainBase.CosmosSDK;
    case ChainNetwork.Straightedge: return ChainBase.CosmosSDK;
    case ChainNetwork.Ethereum: return ChainBase.Ethereum;
    case ChainNetwork.NEAR: return ChainBase.NEAR;
    case ChainNetwork.Moloch: return ChainBase.Ethereum;
    case ChainNetwork.Metacartel: return ChainBase.Ethereum;
    case ChainNetwork.Commonwealth: return ChainBase.Ethereum;
    default: return null;
  }
}

// TODO: this should be deprecated, and replaced with ChainNetwork in most instances
export enum ChainClass {
  Edgeware = 'edgeware',
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
  ALEX = 'alex',
  Commonwealth = 'commonwealth',
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
