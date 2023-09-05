import type {
  IDynamicEndTime,
  IFixedBlockEndTime,
  IFixedEndTime,
  INotStartedEndTime,
  IQueuedEndTime,
  IThresholdEndTime,
  IUnavailableEndTime,
} from './interfaces';
import type Proposal from './Proposal';

export enum ThreadKind {
  Discussion = 'discussion',
  Link = 'link',
}

// TODO: this list should be shared with the server
export enum ThreadStage {
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

export enum ThreadFeaturedFilterTypes {
  Newest = 'newest',
  Oldest = 'oldest',
  MostLikes = 'mostLikes',
  MostComments = 'mostComments',
  LatestActivity = 'latestActivity',
}

export enum CommentsFeaturedFilterTypes {
  Newest = 'newest',
  Oldest = 'oldest',
}

export enum ThreadTimelineFilterTypes {
  AllTime = 'allTime',
  ThisWeek = 'thisWeek',
  ThisMonth = 'thisMonth',
}

export enum ProposalStatus {
  Passing = 'pass',
  Failing = 'fail',
  Canceled = 'canceled',
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
