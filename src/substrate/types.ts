import {
  Header, EventRecord, Extrinsic, Event, IdentityJudgement as SubstrateJudgement,
} from '@polkadot/types/interfaces';

export const EventChains = [
  'edgeware',
  'edgeware-local',
  'edgeware-testnet',
  'kusama',
  'kusama-local',
  'polkadot',
  'polkadot-local',
  'kulupu',
] as const;

/**
 * To implement a new form of event, add it to this enum, and add its
 * JSON interface below (ensure it is stringify-able and then parse-able).
 */

/** Special types for formatting/labeling purposes */
export type BalanceString = string;
export type BigIntString = string;
export type BlockNumber = number;
export type AccountId = string;
export type RuntimeVersion = number;
export enum IdentityJudgement {
  Unknown = 'unknown',
  FeePaid = 'fee-paid',
  Reasonable = 'reasonable',
  KnownGood = 'known-good',
  OutOfDate = 'out-of-date',
  LowQuality = 'low-quality',
  Erroneous = 'erroneous',
}

export function parseJudgement(j: SubstrateJudgement): IdentityJudgement {
  if (j.isFeePaid) return IdentityJudgement.FeePaid;
  if (j.isReasonable) return IdentityJudgement.Reasonable;
  if (j.isKnownGood) return IdentityJudgement.KnownGood;
  if (j.isOutOfDate) return IdentityJudgement.OutOfDate;
  if (j.isLowQuality) return IdentityJudgement.LowQuality;
  if (j.isErroneous) return IdentityJudgement.Erroneous;
  return IdentityJudgement.Unknown;
}

/**
 *  lacks a block type that includes events as well, so we synthesize a type
 * from the combination of headers, events, and extrinsics.
 */
export interface Block {
  header: Header;
  events: EventRecord[];
  extrinsics: Extrinsic[];
  versionNumber: number;
  versionName: string;
}

// Used for grouping EventKinds together for archival purposes
export enum EntityKind {
  DemocracyProposal = 'democracy-proposal',
  DemocracyReferendum = 'democracy-referendum',
  DemocracyPreimage = 'democracy-preimage',
  TreasuryProposal = 'treasury-proposal',
  CollectiveProposal = 'collective-proposal',
  SignalingProposal = 'signaling-proposal',
}

// Each kind of event we handle
// In theory we could use a higher level type-guard here, like
// `e instanceof GenericEvent`, but that makes unit testing
// more difficult, as we need to then mock the original constructor.
export function isEvent(e: Event | Extrinsic): e is Event {
  return !(e.data instanceof Uint8Array);
}

export enum EventKind {
  Slash = 'slash',
  Reward = 'reward',
  Bonded = 'bonded',
  Unbonded = 'unbonded',

  VoteDelegated = 'vote-delegated',
  DemocracyProposed = 'democracy-proposed',
  DemocracyTabled = 'democracy-tabled',
  DemocracyStarted = 'democracy-started',
  DemocracyPassed = 'democracy-passed',
  DemocracyNotPassed = 'democracy-not-passed',
  DemocracyCancelled = 'democracy-cancelled',
  DemocracyExecuted = 'democracy-executed',

  PreimageNoted = 'preimage-noted',
  PreimageUsed = 'preimage-used',
  PreimageInvalid = 'preimage-invalid',
  PreimageMissing = 'preimage-missing',
  PreimageReaped = 'preimage-reaped',

  TreasuryProposed = 'treasury-proposed',
  TreasuryAwarded = 'treasury-awarded',
  TreasuryRejected = 'treasury-rejected',

  ElectionNewTerm = 'election-new-term',
  ElectionEmptyTerm = 'election-empty-term',
  ElectionCandidacySubmitted = 'election-candidacy-submitted',
  ElectionMemberKicked = 'election-member-kicked',
  ElectionMemberRenounced = 'election-member-renounced',

  CollectiveProposed = 'collective-proposed',
  CollectiveVoted = 'collective-voted',
  CollectiveApproved = 'collective-approved',
  CollectiveDisapproved = 'collective-disapproved',
  CollectiveExecuted = 'collective-executed',
  CollectiveMemberExecuted = 'collective-member-executed',
  // TODO: do we want to track votes as events, in collective?

  SignalingNewProposal = 'signaling-new-proposal',
  SignalingCommitStarted = 'signaling-commit-started',
  SignalingVotingStarted = 'signaling-voting-started',
  SignalingVotingCompleted = 'signaling-voting-completed',
  // TODO: do we want to track votes for signaling?

  TreasuryRewardMinting = 'treasury-reward-minting',
  TreasuryRewardMintingV2 = 'treasury-reward-minting-v2',

  IdentitySet = 'identity-set',
  JudgementGiven = 'identity-judgement-given',
  IdentityCleared = 'identity-cleared',
  IdentityKilled = 'identity-killed',

  NewSession = 'new-session',
  AllGood = 'all-good',
  HeartbeatReceived = 'heartbeat-received',
  SomeOffline = 'some-offline',

  // offences events
  Offence = 'offences-offence'
}

interface IEvent {
  kind: EventKind;
}

/**
 * ImOnline Events
 */
export interface IAllGood extends IEvent {
  kind: EventKind.AllGood;
  sessionIndex: number;
  validators: Array<AccountId>;
}

export interface IHeartbeatReceived extends IEvent {
  kind: EventKind.HeartbeatReceived;
  authorityId: string;
}

export interface ISomeOffline extends IEvent {
  kind: EventKind.SomeOffline;
  sessionIndex: number;
  validators: Array<AccountId>;
}

/**
 * Offences Events
 */
export interface IOffence extends IEvent {
  kind: EventKind.Offence;
  offenceKind: string;
  opaqueTimeSlot: string;
  applied: boolean;
  offenders: Array<string>
}

/**
 * Session Event
 */
export interface INewSession extends IEvent {
  kind: EventKind.NewSession;
  activeExposures: { [key: string]: any };
  active: Array<AccountId>;
  waiting: Array<AccountId>;
  sessionIndex: number;
  currentEra?: number;
  validatorInfo : {},
}


/**
 * Staking Events
 */
export interface ISlash extends IEvent {
  kind: EventKind.Slash;
  validator: AccountId;
  amount: BalanceString;
}

export interface IReward extends IEvent {
  kind: EventKind.Reward;
  validator?: AccountId;
  amount: BalanceString;
}

export interface IBonded extends IEvent {
  kind: EventKind.Bonded;
  stash: AccountId;
  amount: BalanceString;
  controller: AccountId;
}

export interface IUnbonded extends IEvent {
  kind: EventKind.Unbonded;
  stash: AccountId;
  amount: BalanceString;
  controller: AccountId;
}

/**
 * Democracy Events
 */
export interface IVoteDelegated extends IEvent {
  kind: EventKind.VoteDelegated;
  who: AccountId;
  target: AccountId;
}

export interface IDemocracyProposed extends IEvent {
  kind: EventKind.DemocracyProposed;
  proposalIndex: number;
  proposalHash: string;
  deposit: BalanceString;
  proposer: AccountId;
}

export interface IDemocracyTabled extends IEvent {
  kind: EventKind.DemocracyTabled;
  proposalIndex: number;
  // TODO: do we want to store depositors?
}

export interface IDemocracyStarted extends IEvent {
  kind: EventKind.DemocracyStarted;
  referendumIndex: number;
  proposalHash: string;
  voteThreshold: string;
  endBlock: BlockNumber;
}

export interface IDemocracyPassed extends IEvent {
  kind: EventKind.DemocracyPassed;
  referendumIndex: number;
  dispatchBlock: BlockNumber | null;
  // TODO: worth enriching with tally?
}

export interface IDemocracyNotPassed extends IEvent {
  kind: EventKind.DemocracyNotPassed;
  referendumIndex: number;
  // TODO: worth enriching with tally?
}

export interface IDemocracyCancelled extends IEvent {
  kind: EventKind.DemocracyCancelled;
  referendumIndex: number;
}

export interface IDemocracyExecuted extends IEvent {
  kind: EventKind.DemocracyExecuted;
  referendumIndex: number;
  executionOk: boolean;
}

/**
 * Preimage Events
 * TODO: do we want to track depositors and deposit amounts?
 */
export interface IPreimageNoted extends IEvent {
  kind: EventKind.PreimageNoted;
  proposalHash: string;
  noter: AccountId;
  preimage: {
    method: string;
    section: string;
    args: string[];
  };
}

export interface IPreimageUsed extends IEvent {
  kind: EventKind.PreimageUsed;
  proposalHash: string;
  noter: AccountId;
}

export interface IPreimageInvalid extends IEvent {
  kind: EventKind.PreimageInvalid;
  proposalHash: string;
  referendumIndex: number;
}

export interface IPreimageMissing extends IEvent {
  kind: EventKind.PreimageMissing;
  proposalHash: string;
  referendumIndex: number;
}

export interface IPreimageReaped extends IEvent {
  kind: EventKind.PreimageReaped;
  proposalHash: string;
  noter: AccountId;
  reaper: AccountId;
}

/**
 * Treasury Events
 */
export interface ITreasuryProposed extends IEvent {
  kind: EventKind.TreasuryProposed;
  proposalIndex: number;
  proposer: AccountId;
  value: BalanceString;
  beneficiary: AccountId;
  bond: BalanceString;
}

export interface ITreasuryAwarded extends IEvent {
  kind: EventKind.TreasuryAwarded;
  proposalIndex: number;
  value: BalanceString;
  beneficiary: AccountId;
}

export interface ITreasuryRejected extends IEvent {
  kind: EventKind.TreasuryRejected;
  proposalIndex: number;
  // can also fetch slashed bond value if needed
  // cannot fetch other data because proposal data disappears on rejection
}

/**
 * Elections Events
 */
export interface IElectionNewTerm extends IEvent {
  kind: EventKind.ElectionNewTerm;
  newMembers: AccountId[];
}

export interface IElectionEmptyTerm extends IEvent {
  kind: EventKind.ElectionEmptyTerm;
}

export interface ICandidacySubmitted extends IEvent {
  kind: EventKind.ElectionCandidacySubmitted;
  candidate: AccountId;
}

export interface IElectionMemberKicked extends IEvent {
  kind: EventKind.ElectionMemberKicked;
  who: AccountId;
}

export interface IElectionMemberRenounced extends IEvent {
  kind: EventKind.ElectionMemberRenounced;
  who: AccountId;
}

/**
 * Collective Events
 */
export interface ICollectiveProposed extends IEvent {
  kind: EventKind.CollectiveProposed;
  collectiveName?: 'council' | 'technicalCommittee';
  proposer: AccountId;
  proposalIndex: number;
  proposalHash: string;
  threshold: number;
  // TODO: add end block?
  call: {
    method: string;
    section: string;
    args: string[];
  };
}

export interface ICollectiveVoted extends IEvent {
  kind: EventKind.CollectiveVoted;
  collectiveName?: 'council' | 'technicalCommittee';
  proposalHash: string;
  voter: AccountId;
  vote: boolean;
}

export interface ICollectiveApproved extends IEvent {
  kind: EventKind.CollectiveApproved;
  collectiveName?: 'council' | 'technicalCommittee';
  proposalHash: string;
}

export interface ICollectiveDisapproved extends IEvent {
  kind: EventKind.CollectiveDisapproved;
  collectiveName?: 'council' | 'technicalCommittee';
  proposalHash: string;
}

export interface ICollectiveExecuted extends IEvent {
  kind: EventKind.CollectiveExecuted;
  collectiveName?: 'council' | 'technicalCommittee';
  proposalHash: string;
  executionOk: boolean;
}

export interface ICollectiveMemberExecuted extends IEvent {
  kind: EventKind.CollectiveMemberExecuted;
  collectiveName?: 'council' | 'technicalCommittee';
  proposalHash: string;
  executionOk: boolean;
}

/**
 * Signaling Events
 */
export interface ISignalingNewProposal extends IEvent {
  kind: EventKind.SignalingNewProposal;
  proposer: AccountId;
  proposalHash: string;
  voteId: BigIntString;
  title: string;
  description: string;
  tallyType: string;
  voteType: string;
  choices: string[];
}

export interface ISignalingCommitStarted extends IEvent {
  kind: EventKind.SignalingCommitStarted;
  proposalHash: string;
  voteId: BigIntString;
  endBlock: number;
}

export interface ISignalingVotingStarted extends IEvent {
  kind: EventKind.SignalingVotingStarted;
  proposalHash: string;
  voteId: BigIntString;
  endBlock: number;
}

export interface ISignalingVotingCompleted extends IEvent {
  kind: EventKind.SignalingVotingCompleted;
  proposalHash: string;
  voteId: BigIntString;
  // TODO: worth enriching with tally?
}

/**
 * TreasuryReward events
 */
export interface ITreasuryRewardMinting extends IEvent {
  kind: EventKind.TreasuryRewardMinting;
  pot: BalanceString;
  reward: BalanceString;
}
export interface ITreasuryRewardMintingV2 extends IEvent {
  kind: EventKind.TreasuryRewardMintingV2;
  pot: BalanceString;
  potAddress: AccountId;
}

/**
 * Identity events
 */
export interface IIdentitySet extends IEvent {
  kind: EventKind.IdentitySet;
  who: AccountId;
  displayName: string;
  judgements: [AccountId, IdentityJudgement][];
}

export interface IJudgementGiven extends IEvent {
  kind: EventKind.JudgementGiven;
  who: AccountId;
  registrar: AccountId;
  judgement: IdentityJudgement;
}

export interface IIdentityCleared extends IEvent {
  kind: EventKind.IdentityCleared;
  who: AccountId;
}

export interface IIdentityKilled extends IEvent {
  kind: EventKind.IdentityKilled;
  who: AccountId;
}

export type IEventData =
  ISlash
  | IReward
  | IBonded
  | IUnbonded
  | IVoteDelegated
  | IDemocracyProposed
  | IDemocracyTabled
  | IDemocracyStarted
  | IDemocracyPassed
  | IDemocracyNotPassed
  | IDemocracyCancelled
  | IDemocracyExecuted
  | IPreimageNoted
  | IPreimageUsed
  | IPreimageInvalid
  | IPreimageMissing
  | IPreimageReaped
  | ITreasuryProposed
  | ITreasuryAwarded
  | ITreasuryRejected
  | IElectionNewTerm
  | IElectionEmptyTerm
  | ICandidacySubmitted
  | IElectionMemberKicked
  | IElectionMemberRenounced
  | ICollectiveProposed
  | ICollectiveVoted
  | ICollectiveApproved
  | ICollectiveDisapproved
  | ICollectiveExecuted
  | ICollectiveMemberExecuted
  | ISignalingNewProposal
  | ISignalingCommitStarted
  | ISignalingVotingStarted
  | ISignalingVotingCompleted
  | ITreasuryRewardMinting
  | ITreasuryRewardMintingV2
  | IIdentitySet
  | IJudgementGiven
  | IIdentityCleared
  | IIdentityKilled
  | INewSession
  | IHeartbeatReceived
  | ISomeOffline
  | IAllGood
  | IOffence
// eslint-disable-next-line semi-style
;

export const EventKinds: EventKind[] = Object.values(EventKind);

/**
 * The following auxiliary types and functions are used in migrations and should
 * not be relied upon for general implementations.
 */
export type IDemocracyProposalEvents =
  IDemocracyProposed | IDemocracyTabled;
export type IDemocracyReferendumEvents =
  IDemocracyStarted | IDemocracyPassed | IDemocracyNotPassed
  | IDemocracyCancelled | IDemocracyExecuted;
export type IDemocracyPreimageEvents =
  IPreimageNoted | IPreimageUsed | IPreimageInvalid
  | IPreimageMissing | IPreimageReaped;
export type ITreasuryProposalEvents =
  ITreasuryProposed | ITreasuryRejected | ITreasuryAwarded;
export type ICollectiveProposalEvents =
  ICollectiveProposed | ICollectiveVoted | ICollectiveApproved
  | ICollectiveDisapproved | ICollectiveExecuted;
export type ISignalingProposalEvents =
  ISignalingNewProposal | ISignalingCommitStarted
  | ISignalingVotingStarted | ISignalingVotingCompleted;
