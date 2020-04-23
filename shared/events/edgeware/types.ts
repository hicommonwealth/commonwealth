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
  DemocracyStarted = 'democracy-started',
  DemocracyPassed = 'democracy-passed',
  DemocracyNotPassed = 'democracy-not-passed',
  DemocracyCancelled = 'democracy-cancelled',
  DemocracyExecuted = 'democracy-executed',
  TreasuryProposed = 'treasury-proposed',
  TreasuryAwarded = 'treasury-awarded',
  TreasuryRejected = 'treasury-rejected',
}

interface ISubstrateEvent {
  kind: SubstrateEventKind;
  version: SubstrateRuntimeVersion;
}

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

export type ISubstrateEventData =
  ISubstrateSlash
  | ISubstrateReward
  | ISubstrateBonded
  | ISubstrateUnbonded
  | ISubstrateVoteDelegated
  | ISubstrateDemocracyProposed
  | ISubstrateDemocracyStarted
  | ISubstrateDemocracyPassed
  | ISubstrateDemocracyNotPassed
  | ISubstrateDemocracyCancelled
  | ISubstrateDemocracyExecuted
  | ISubstrateTreasuryProposed
  | ISubstrateTreasuryAwarded
  | ISubstrateTreasuryRejected
// eslint-disable-next-line semi-style
;

export const SubstrateEventKinds: SubstrateEventKind[] = Object.values(SubstrateEventKind);
