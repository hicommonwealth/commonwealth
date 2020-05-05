import { Header, EventRecord, Extrinsic, Event } from '@polkadot/types/interfaces';

/**
 * To implement a new form of event, add it to this enum, and add its
 * JSON interface below (ensure it is stringify-able and then parse-able).
 */

/** Special types for formatting/labeling purposes */
export type SubstrateBalanceString = string;
export type SubstrateBigIntString = string;
export type SubstrateBlockNumber = number;
export type SubstrateAccountId = string;
export type SubstrateRuntimeVersion = number;

/**
 * Substrate lacks a block type that includes events as well, so we synthesize a type
 * from the combination of headers, events, and extrinsics.
 */
export interface SubstrateBlock {
  header: Header;
  events: EventRecord[];
  extrinsics: Extrinsic[];
  versionNumber: number;
  versionName: string;
}

// In theory we could use a higher level type-guard here, like
// `e instanceof GenericEvent`, but that makes unit testing
// more difficult, as we need to then mock the original constructor.
export function isEvent(e: Event | Extrinsic): e is Event {
  return !(e.data instanceof Uint8Array);
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
  proposalHash: string;
  deposit: SubstrateBalanceString;
  proposer: SubstrateAccountId;
}

export interface ISubstrateDemocracyTabled extends ISubstrateEvent {
  kind: SubstrateEventKind.DemocracyTabled;
  proposalIndex: number;
  // TODO: do we want to store depositors?
}

export interface ISubstrateDemocracyStarted extends ISubstrateEvent {
  kind: SubstrateEventKind.DemocracyStarted;
  referendumIndex: number;
  proposalHash: string;
  voteThreshold: string;
  endBlock: SubstrateBlockNumber;
}

export interface ISubstrateDemocracyPassed extends ISubstrateEvent {
  kind: SubstrateEventKind.DemocracyPassed;
  referendumIndex: number;
  dispatchBlock: SubstrateBlockNumber | null;
  // TODO: worth enriching with tally?
}

export interface ISubstrateDemocracyNotPassed extends ISubstrateEvent {
  kind: SubstrateEventKind.DemocracyNotPassed;
  referendumIndex: number;
  // TODO: worth enriching with tally?
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
 * TODO: do we want to track depositors and deposit amounts?
 */
export interface ISubstratePreimageNoted extends ISubstrateEvent {
  kind: SubstrateEventKind.PreimageNoted;
  proposalHash: string;
  noter: SubstrateAccountId;
}

export interface ISubstratePreimageUsed extends ISubstrateEvent {
  kind: SubstrateEventKind.PreimageUsed;
  proposalHash: string;
  noter: SubstrateAccountId;
}

export interface ISubstratePreimageInvalid extends ISubstrateEvent {
  kind: SubstrateEventKind.PreimageInvalid;
  proposalHash: string;
  referendumIndex: number;
}

export interface ISubstratePreimageMissing extends ISubstrateEvent {
  kind: SubstrateEventKind.PreimageMissing;
  proposalHash: string;
  referendumIndex: number;
}

export interface ISubstratePreimageReaped extends ISubstrateEvent {
  kind: SubstrateEventKind.PreimageReaped;
  proposalHash: string;
  noter: SubstrateAccountId;
  reaper: SubstrateAccountId;
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
  newMembers: SubstrateAccountId[];
}

export interface ISubstrateElectionEmptyTerm extends ISubstrateEvent {
  kind: SubstrateEventKind.ElectionEmptyTerm;
}

export interface ISubstrateCandidacySubmitted extends ISubstrateEvent {
  kind: SubstrateEventKind.ElectionCandidacySubmitted;
  candidate: SubstrateAccountId;
}

export interface ISubstrateElectionMemberKicked extends ISubstrateEvent {
  kind: SubstrateEventKind.ElectionMemberKicked;
  who: SubstrateAccountId;
}

export interface ISubstrateElectionMemberRenounced extends ISubstrateEvent {
  kind: SubstrateEventKind.ElectionMemberRenounced;
  who: SubstrateAccountId;
}

/**
 * Collective Events
 */
export interface ISubstrateCollectiveProposed extends ISubstrateEvent {
  kind: SubstrateEventKind.CollectiveProposed;
  proposer: SubstrateAccountId;
  proposalIndex: number;
  proposalHash: string;
  threshold: number;
}

export interface ISubstrateCollectiveApproved extends ISubstrateEvent {
  kind: SubstrateEventKind.CollectiveApproved;
  proposalHash: string;
  proposalIndex: number;
  threshold: number;
  ayes: SubstrateAccountId[];
  nays: SubstrateAccountId[];
}

export interface ISubstrateCollectiveDisapproved extends ISubstrateEvent {
  kind: SubstrateEventKind.CollectiveDisapproved;
  proposalHash: string;
  proposalIndex: number;
  threshold: number;
  ayes: SubstrateAccountId[];
  nays: SubstrateAccountId[];
}

export interface ISubstrateCollectiveExecuted extends ISubstrateEvent {
  kind: SubstrateEventKind.CollectiveExecuted;
  proposalHash: string;
  executionOk: boolean;
}

export interface ISubstrateCollectiveMemberExecuted extends ISubstrateEvent {
  kind: SubstrateEventKind.CollectiveMemberExecuted;
  proposalHash: string;
  executionOk: boolean;
}

/**
 * Signaling Events
 */
export interface ISubstrateSignalingNewProposal extends ISubstrateEvent {
  kind: SubstrateEventKind.SignalingNewProposal;
  proposer: SubstrateAccountId;
  proposalHash: string;
  voteId: SubstrateBigIntString;
}

export interface ISubstrateSignalingCommitStarted extends ISubstrateEvent {
  kind: SubstrateEventKind.SignalingCommitStarted;
  proposalHash: string;
  voteId: SubstrateBigIntString;
  endBlock: number;
}

export interface ISubstrateSignalingVotingStarted extends ISubstrateEvent {
  kind: SubstrateEventKind.SignalingVotingStarted;
  proposalHash: string;
  voteId: SubstrateBigIntString;
  endBlock: number;
}

export interface ISubstrateSignalingVotingCompleted extends ISubstrateEvent {
  kind: SubstrateEventKind.SignalingVotingCompleted;
  proposalHash: string;
  voteId: SubstrateBigIntString;
  // TODO: worth enriching with tally?
}

/**
 * TreasuryReward events
 */
export interface ISubstrateTreasuryRewardMinting extends ISubstrateEvent {
  kind: SubstrateEventKind.TreasuryRewardMinting;
  pot: SubstrateBalanceString;
  reward: SubstrateBalanceString;
}
export interface ISubstrateTreasuryRewardMintingV2 extends ISubstrateEvent {
  kind: SubstrateEventKind.TreasuryRewardMintingV2;
  pot: SubstrateBalanceString;
  potAddress: SubstrateAccountId;
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
  | ISubstratePreimageUsed
  | ISubstratePreimageInvalid
  | ISubstratePreimageMissing
  | ISubstratePreimageReaped
  | ISubstrateTreasuryProposed
  | ISubstrateTreasuryAwarded
  | ISubstrateTreasuryRejected
  | ISubstrateElectionNewTerm
  | ISubstrateElectionEmptyTerm
  | ISubstrateCandidacySubmitted
  | ISubstrateElectionMemberKicked
  | ISubstrateElectionMemberRenounced
  | ISubstrateCollectiveProposed
  | ISubstrateCollectiveApproved
  | ISubstrateCollectiveDisapproved
  | ISubstrateCollectiveExecuted
  | ISubstrateCollectiveMemberExecuted
  | ISubstrateSignalingNewProposal
  | ISubstrateSignalingCommitStarted
  | ISubstrateSignalingVotingStarted
  | ISubstrateSignalingVotingCompleted
  | ISubstrateTreasuryRewardMinting
  | ISubstrateTreasuryRewardMintingV2
// eslint-disable-next-line semi-style
;

export const SubstrateEventKinds: SubstrateEventKind[] = Object.values(SubstrateEventKind);
