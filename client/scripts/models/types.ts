import {
  IFixedEndTime,
  IFixedBlockEndTime,
  IDynamicEndTime,
  IThresholdEndTime,
  INotStartedEndTime,
  IQueuedEndTime,
  IUnavailableEndTime,
} from './interfaces';
import Proposal from './Proposal';

// TODO: this is inconsistently used
export enum OffchainThreadKind {
  Forum = 'forum',
  Link = 'link',
  Question = 'question',
  Request = 'request',
}

// TODO: this list should be shared with the server
export enum OffchainThreadStage {
  Discussion = 'discussion',
  ProposalInReview = 'proposal_in_review',
  Voting = 'voting',
  Passed = 'passed',
  Failed = 'failed',
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
  CompoundYesNo = 'compound_yes_no',
  CompoundYesNoAbstain = 'compound_yes_no_abstain',
  YesNoReject = 'yes_no_reject',
}
export enum VotingUnit {
  OnePersonOneVote = '1p1v',
  CoinVote = 'coin',
  ConvictionCoinVote = 'conviction_coin',
  PowerVote = 'power',
  None = 'none',
}

export type ProposalEndTime =
  | IFixedEndTime
  | IFixedBlockEndTime
  | IDynamicEndTime
  | IThresholdEndTime
  | INotStartedEndTime
  | IQueuedEndTime
  | IUnavailableEndTime;

export type AnyProposal = Proposal<any, any, any, any>;
