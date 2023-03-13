import type {
  Header,
  EventRecord,
  Extrinsic,
  Event,
  IdentityJudgement as SubstrateJudgement,
} from '@polkadot/types/interfaces';
import type { RegisteredTypes } from '@polkadot/types/types';

import type { EnricherConfig } from './filters/enricher';

export interface ISubstrateListenerOptions {
  startBlock: number;
  skipCatchup: boolean;
  archival: boolean;
  url: string;
  spec: RegisteredTypes;
  enricherConfig: EnricherConfig;
}

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
// eslint-disable-next-line no-shadow
export enum IdentityJudgement {
  Unknown = 'unknown',
  FeePaid = 'fee-paid',
  Reasonable = 'reasonable',
  KnownGood = 'known-good',
  OutOfDate = 'out-of-date',
  LowQuality = 'low-quality',
  Erroneous = 'erroneous',
}

export interface BountyStatusCuratorProposed {
  curator: AccountId;
}

export interface BountyStatusActive {
  curator: AccountId;
  updateDue: BlockNumber;
}

export interface BountyStatusPendingPayout {
  curator: AccountId;
  beneficiary: AccountId;
  unlockAt: BlockNumber;
}

export interface BountyStatus {
  isProposed: boolean;
  isApproved: boolean;
  isFunded: boolean;
  isCuratorProposed: boolean;
  asCuratorProposed: BountyStatusCuratorProposed;
  isActive: boolean;
  asActive: BountyStatusActive;
  isPendingPayout: boolean;
  asPendingPayout: BountyStatusPendingPayout;
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

export interface Validator {
  commissionPer: number;
  controllerId: AccountId;
  rewardDestination: string;
  nextSessionIds: string;
  eraPoints: number;
}

// Used for grouping EventKinds together for archival purposes
// eslint-disable-next-line no-shadow
export enum EntityKind {
  DemocracyProposal = 'democracy-proposal',
  DemocracyReferendum = 'democracy-referendum',
  DemocracyPreimage = 'democracy-preimage',
  TreasuryProposal = 'treasury-proposal',
  TipProposal = 'tip-proposal',
}

// Each kind of event we handle
// In theory we could use a higher level type-guard here, like
// `e instanceof GenericEvent`, but that makes unit testing
// more difficult, as we need to then mock the original constructor.
export function isEvent(e: Event | Extrinsic): e is Event {
  return !(e.data instanceof Uint8Array);
}

// eslint-disable-next-line no-shadow
export enum EventKind {
  Slash = 'slash',
  Reward = 'reward',
  Bonded = 'bonded',
  Unbonded = 'unbonded',

  BalanceTransfer = 'balance-transfer',

  StakingElection = 'staking-election',

  VoteDelegated = 'vote-delegated',
  DemocracyProposed = 'democracy-proposed',
  DemocracySeconded = 'democracy-seconded',
  DemocracyTabled = 'democracy-tabled',
  DemocracyStarted = 'democracy-started',
  DemocracyVoted = 'democracy-voted',
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

  NewTip = 'new-tip',
  TipVoted = 'tip-voted',
  TipClosing = 'tip-closing',
  TipClosed = 'tip-closed',
  TipRetracted = 'tip-retracted',
  TipSlashed = 'tip-slashed',

  ElectionNewTerm = 'election-new-term',
  ElectionEmptyTerm = 'election-empty-term',
  ElectionCandidacySubmitted = 'election-candidacy-submitted',
  ElectionMemberKicked = 'election-member-kicked',
  ElectionMemberRenounced = 'election-member-renounced',

  TreasuryRewardMinting = 'treasury-reward-minting',
  TreasuryRewardMintingV2 = 'treasury-reward-minting-v2',

  IdentitySet = 'identity-set',
  IdentityCleared = 'identity-cleared',
  IdentityKilled = 'identity-killed',

  NewSession = 'new-session',
  AllGood = 'all-good',
  HeartbeatReceived = 'heartbeat-received',
  SomeOffline = 'some-offline',

  // offences events
  Offence = 'offences-offence',
}

interface IEvent {
  kind: EventKind;
}

export interface IBalanceTransfer extends IEvent {
  kind: EventKind.BalanceTransfer;
  sender: AccountId;
  dest: AccountId;
  value: BalanceString;
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
  offenders: Array<string>;
}

// Individual Exposure
export interface IndividualExposure {
  who: AccountId;
  value: string;
}

// Active Exposure
export interface ActiveExposure {
  [key: string]: {
    own: number;
    total: number;
    others: IndividualExposure[];
  };
}

/**
 * Session Event
 */
export interface INewSession extends IEvent {
  kind: EventKind.NewSession;
  activeExposures: ActiveExposure;
  active: Array<AccountId>;
  waiting: Array<AccountId>;
  sessionIndex: number;
  currentEra?: number;
  validatorInfo: { [key: string]: Validator };
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

export interface IStakingElection extends IEvent {
  kind: EventKind.StakingElection;
  era: number;
  validators: AccountId[];
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

export interface IDemocracySeconded extends IEvent {
  kind: EventKind.DemocracySeconded;
  proposalIndex: number;
  who: AccountId;
}

export interface IDemocracyTabled extends IEvent {
  kind: EventKind.DemocracyTabled;
  proposalIndex: number;
}

export interface IDemocracyStarted extends IEvent {
  kind: EventKind.DemocracyStarted;
  referendumIndex: number;
  proposalHash: string;
  voteThreshold: string;
  endBlock: BlockNumber;
}

export interface IDemocracyVoted extends IEvent {
  kind: EventKind.DemocracyVoted;
  referendumIndex: number;
  who: AccountId;
  isAye: boolean;
  conviction: number; // index of the conviction enum
  balance: BalanceString;
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
 * Tips Events
 */
export interface INewTip extends IEvent {
  kind: EventKind.NewTip;
  proposalHash: string;
  reason: string;
  who: AccountId;
  finder: AccountId;
  deposit: BalanceString;
  findersFee: boolean;
}

// from extrinsic, not event
export interface ITipVoted extends IEvent {
  kind: EventKind.TipVoted;
  proposalHash: string;
  who: AccountId;
  value: BalanceString;
}

export interface ITipClosing extends IEvent {
  kind: EventKind.TipClosing;
  closing: BlockNumber;
  proposalHash: string;
}

export interface ITipClosed extends IEvent {
  kind: EventKind.TipClosed;
  proposalHash: string;
  who: AccountId;
  payout: BalanceString;
}

export interface ITipRetracted extends IEvent {
  kind: EventKind.TipRetracted;
  proposalHash: string;
}

export interface ITipSlashed extends IEvent {
  kind: EventKind.TipSlashed;
  proposalHash: string;
  finder: AccountId;
  deposit: BalanceString;
}

/**
 * Elections Events
 */
export interface IElectionNewTerm extends IEvent {
  kind: EventKind.ElectionNewTerm;
  round: number;
  newMembers: AccountId[];
  allMembers: AccountId[];
}

export interface IElectionEmptyTerm extends IEvent {
  kind: EventKind.ElectionEmptyTerm;
  round: number;
  members: AccountId[];
}

export interface ICandidacySubmitted extends IEvent {
  kind: EventKind.ElectionCandidacySubmitted;
  round: number;
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

export interface IIdentityCleared extends IEvent {
  kind: EventKind.IdentityCleared;
  who: AccountId;
}

export interface IIdentityKilled extends IEvent {
  kind: EventKind.IdentityKilled;
  who: AccountId;
}

// Interface for era reward points
export interface AccountPoints {
  [key: string]: number;
}

export type IEventData =
  | ISlash
  | IReward
  | IBonded
  | IUnbonded
  | IBalanceTransfer
  | IStakingElection
  | IVoteDelegated
  | IDemocracyProposed
  | IDemocracySeconded
  | IDemocracyTabled
  | IDemocracyStarted
  | IDemocracyVoted
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
  | INewTip
  | ITipVoted
  | ITipClosing
  | ITipClosed
  | ITipRetracted
  | ITipSlashed
  | IElectionNewTerm
  | IElectionEmptyTerm
  | ICandidacySubmitted
  | IElectionMemberKicked
  | IElectionMemberRenounced
  | ITreasuryRewardMinting
  | ITreasuryRewardMintingV2
  | IIdentitySet
  | IIdentityCleared
  | IIdentityKilled
  | INewSession
  | IHeartbeatReceived
  | ISomeOffline
  | IAllGood
  | IOffence;
// eslint-disable-next-line semi-style

export const EventKinds: EventKind[] = Object.values(EventKind);

/**
 * The following auxiliary types and functions are used in migrations and should
 * not be relied upon for general implementations.
 */
export type IDemocracyProposalEvents =
  | IDemocracyProposed
  | IDemocracySeconded
  | IDemocracyTabled;
export type IDemocracyReferendumEvents =
  | IDemocracyStarted
  | IDemocracyVoted
  | IDemocracyPassed
  | IDemocracyNotPassed
  | IDemocracyCancelled
  | IDemocracyExecuted;
export type IDemocracyPreimageEvents =
  | IPreimageNoted
  | IPreimageUsed
  | IPreimageInvalid
  | IPreimageMissing
  | IPreimageReaped;
export type ITreasuryProposalEvents =
  | ITreasuryProposed
  | ITreasuryRejected
  | ITreasuryAwarded;
