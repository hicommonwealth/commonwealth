import { Header, EventRecord } from '@polkadot/types/interfaces';

/**
 * To implement a new form of event, add it to this enum, and add its
 * JSON interface below (ensure it is stringify-able and then parse-able).
 */

/** Special types for formatting/labeling purposes */
export type SubstrateBalanceString = string;
export type SubstrateBlockNumber = number;
export type SubstrateAccountId = string;
export type SubstrateRuntimeVersion = number;

/**
 * Substrate lacks a block type that includes events as well, so we synthesize a type
 * from the combination of headers and events.
 */
export interface SubstrateBlock {
  header: Header;
  events: EventRecord[];
  version: SubstrateRuntimeVersion;
}

export enum SubstrateEventKind {
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
  // XXX
  // PreimageUsed = 'preimage-used',
  PreimageInvalid = 'preimage-invalid',
  PreimageMissing = 'preimage-missing',
  PreimageReaped = 'preimage-reaped',

  TreasuryProposed = 'treasury-proposed',
  TreasuryAwarded = 'treasury-awarded',
  TreasuryRejected = 'treasury-rejected',

  ElectionNewTerm = 'election-new-term',
  ElectionEmptyTerm = 'election-empty-term',
  ElectionMemberKicked = 'election-member-kicked',
  ElectionMemberRenounced = 'election-member-renounced',

  CollectiveProposed = 'collective-proposed',
  CollectiveApproved = 'collective-approved',
  CollectiveExecuted = 'collective-executed',
  CollectiveMemberExecuted = 'collective-member-executed',
  // TODO: do we want to track votes as events, in collective?

  SignalingNewProposal = 'signaling-new-proposal',
  SignalingCommitStarted = 'signaling-commit-started',
  SignalingVotingStarted = 'signaling-voting-started',
  SignalingVotingCompleted = 'signaling-voting-completed',
  // TODO: do we want to track votes for signaling?
}

interface ISubstrateEvent {
  kind: SubstrateEventKind;
}

/**
 * Staking Events
 */
export interface ISubstrateSlash extends ISubstrateEvent {
  kind: SubstrateEventKind.Slash;
  validator: SubstrateAccountId;
  amount: SubstrateBalanceString;
}

export interface ISubstrateReward extends ISubstrateEvent {
  kind: SubstrateEventKind.Reward;
  validator?: SubstrateAccountId;
  amount: SubstrateBalanceString;
}

export interface ISubstrateBonded extends ISubstrateEvent {
  kind: SubstrateEventKind.Bonded;
  stash: SubstrateAccountId;
  amount: SubstrateBalanceString;
  controller: SubstrateAccountId;
}

export interface ISubstrateUnbonded extends ISubstrateEvent {
  kind: SubstrateEventKind.Unbonded;
  stash: SubstrateAccountId;
  amount: SubstrateBalanceString;
  controller: SubstrateAccountId;
}

/**
 * Democracy Events
 */
export interface ISubstrateVoteDelegated extends ISubstrateEvent {
  kind: SubstrateEventKind.VoteDelegated;
  who: SubstrateAccountId;
  target: SubstrateAccountId;
}

export interface ISubstrateDemocracyProposed extends ISubstrateEvent {
  kind: SubstrateEventKind.DemocracyProposed;
  proposalIndex: number;
  deposit: SubstrateBalanceString;
  proposer: SubstrateAccountId;
}

export interface ISubstrateDemocracyTabled extends ISubstrateEvent {
  kind: SubstrateEventKind.DemocracyTabled;
  // TODO
}

export interface ISubstrateDemocracyStarted extends ISubstrateEvent {
  kind: SubstrateEventKind.DemocracyStarted;
  referendumIndex: number;
  endBlock: SubstrateBlockNumber | null;
}

export interface ISubstrateDemocracyPassed extends ISubstrateEvent {
  kind: SubstrateEventKind.DemocracyPassed;
  referendumIndex: number;
  dispatchBlock: SubstrateBlockNumber | null;
}

export interface ISubstrateDemocracyNotPassed extends ISubstrateEvent {
  kind: SubstrateEventKind.DemocracyNotPassed;
  referendumIndex: number;
}

export interface ISubstrateDemocracyCancelled extends ISubstrateEvent {
  kind: SubstrateEventKind.DemocracyCancelled;
  referendumIndex: number;
}

export interface ISubstrateDemocracyExecuted extends ISubstrateEvent {
  kind: SubstrateEventKind.DemocracyExecuted;
  referendumIndex: number;
  executionOk: boolean;
}

/**
 * Preimage Events
 */
export interface ISubstratePreimageNoted extends ISubstrateEvent {
  kind: SubstrateEventKind.PreimageNoted;
  // TODO
}

export interface ISubstratePreimageInvalid extends ISubstrateEvent {
  kind: SubstrateEventKind.PreimageInvalid;
  // TODO
}

export interface ISubstratePreimageMissing extends ISubstrateEvent {
  kind: SubstrateEventKind.PreimageMissing;
  // TODO
}

export interface ISubstratePreimageReaped extends ISubstrateEvent {
  kind: SubstrateEventKind.PreimageReaped;
  // TODO
}

/**
 * Treasury Events
 */
export interface ISubstrateTreasuryProposed extends ISubstrateEvent {
  kind: SubstrateEventKind.TreasuryProposed;
  proposalIndex: number;
  proposer: SubstrateAccountId;
  value: SubstrateBalanceString;
  beneficiary: SubstrateAccountId;
  // can also fetch bond if needed
}

export interface ISubstrateTreasuryAwarded extends ISubstrateEvent {
  kind: SubstrateEventKind.TreasuryAwarded;
  proposalIndex: number;
  value: SubstrateBalanceString;
  beneficiary: SubstrateAccountId;
}

export interface ISubstrateTreasuryRejected extends ISubstrateEvent {
  kind: SubstrateEventKind.TreasuryRejected;
  proposalIndex: number;
  // can also fetch slashed bond value if needed
  // cannot fetch other data because proposal data disappears on rejection
}

/**
 * Elections Events
 */
export interface ISubstrateElectionNewTerm extends ISubstrateEvent {
  kind: SubstrateEventKind.ElectionNewTerm;
  // TODO
}

export interface ISubstrateElectionEmptyTerm extends ISubstrateEvent {
  kind: SubstrateEventKind.ElectionEmptyTerm;
  // TODO
}

export interface ISubstrateElectionMemberKicked extends ISubstrateEvent {
  kind: SubstrateEventKind.ElectionMemberKicked;
  // TODO
}

export interface ISubstrateElectionMemberRenounced extends ISubstrateEvent {
  kind: SubstrateEventKind.ElectionMemberRenounced;
  // TODO
}

/**
 * Collective Events
 */
export interface ISubstrateCollectiveProposed extends ISubstrateEvent {
  kind: SubstrateEventKind.CollectiveProposed;
  // TODO
}

export interface ISubstrateCollectiveApproved extends ISubstrateEvent {
  kind: SubstrateEventKind.CollectiveApproved;
  // TODO
}

export interface ISubstrateCollectiveExecuted extends ISubstrateEvent {
  kind: SubstrateEventKind.CollectiveExecuted;
  // TODO
}

export interface ISubstrateCollectiveMemberExecuted extends ISubstrateEvent {
  kind: SubstrateEventKind.CollectiveMemberExecuted;
  // TODO
}

/**
 * Signaling Events
 */
export interface ISubstrateSignalingNewProposal extends ISubstrateEvent {
  kind: SubstrateEventKind.SignalingNewProposal;
  // TODO
}

export interface ISubstrateSignalingCommitStarted extends ISubstrateEvent {
  kind: SubstrateEventKind.SignalingCommitStarted;
  // TODO
}

export interface ISubstrateSignalingVotingStarted extends ISubstrateEvent {
  kind: SubstrateEventKind.SignalingVotingStarted;
  // TODO
}

export interface ISubstrateSignalingVotingCompleted extends ISubstrateEvent {
  kind: SubstrateEventKind.SignalingVotingCompleted;
  // TODO
}

export type ISubstrateEventData =
  ISubstrateSlash
  | ISubstrateReward
  | ISubstrateBonded
  | ISubstrateUnbonded
  | ISubstrateVoteDelegated
  | ISubstrateDemocracyProposed
  | ISubstrateDemocracyTabled
  | ISubstrateDemocracyStarted
  | ISubstrateDemocracyPassed
  | ISubstrateDemocracyNotPassed
  | ISubstrateDemocracyCancelled
  | ISubstrateDemocracyExecuted
  | ISubstratePreimageNoted
  | ISubstratePreimageInvalid
  | ISubstratePreimageMissing
  | ISubstratePreimageReaped
  | ISubstrateTreasuryProposed
  | ISubstrateTreasuryAwarded
  | ISubstrateTreasuryRejected
  | ISubstrateElectionNewTerm
  | ISubstrateElectionEmptyTerm
  | ISubstrateElectionMemberKicked
  | ISubstrateElectionMemberRenounced
  | ISubstrateCollectiveProposed
  | ISubstrateCollectiveApproved
  | ISubstrateCollectiveExecuted
  | ISubstrateCollectiveMemberExecuted
  | ISubstrateSignalingNewProposal
  | ISubstrateSignalingCommitStarted
  | ISubstrateSignalingVotingStarted
  | ISubstrateSignalingVotingCompleted
// eslint-disable-next-line semi-style
;

export const SubstrateEventKinds: SubstrateEventKind[] = Object.values(SubstrateEventKind);
