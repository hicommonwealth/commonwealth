import { Header, EventRecord } from '@polkadot/types/interfaces';

/**
 * Substrate lacks a block type that includes events as well, so we synthesize a type
 * from the combination of headers and events.
 */
export interface SubstrateBlock {
  header: Header;
  events: EventRecord[];
}

/**
 * To implement a new form of event, add it to this enum, and add its
 * JSON interface below (ensure it is stringify-able and then parse-able).
 */

/** Special types for formatting/labeling purposes */
export type SubstrateBalanceString = string;
export type SubstrateBlockNumber = number;
export type SubstrateAccountId = string;

export interface ISubstrateSlashEvent {
  kind: 'slash';
  validator: SubstrateAccountId;
  amount: SubstrateBalanceString;
}

export interface ISubstrateRewardEvent {
  kind: 'reward';
  validator: SubstrateAccountId;
  amount: SubstrateBalanceString;
}

export interface ISubstrateDemocracyProposed {
  kind: 'democracy-proposed';
  proposalIndex: number;
  deposit: SubstrateBalanceString;
}

export interface ISubstrateDemocracyStarted {
  kind: 'democracy-started';
  referendumIndex: number;
  endBlock: SubstrateBlockNumber | null;
}

export interface ISubstrateDemocracyPassed {
  kind: 'democracy-passed';
  referendumIndex: number;
  dispatchBlock: SubstrateBlockNumber | null;
}

export interface ISubstrateDemocracyNotPassed {
  kind: 'democracy-not-passed';
  referendumIndex: number;
}

export interface ISubstrateDemocracyCancelled {
  kind: 'democracy-cancelled';
  referendumIndex: number;
}

export type ISubstrateEventData = ISubstrateSlashEvent
  | ISubstrateRewardEvent
  | ISubstrateDemocracyProposed
  | ISubstrateDemocracyStarted
  | ISubstrateDemocracyPassed
  | ISubstrateDemocracyNotPassed
  | ISubstrateDemocracyCancelled;

export type SubstrateEventKind = ISubstrateEventData[keyof ISubstrateEventData];

export const SubstrateEventKindMap: { [P in SubstrateEventKind]: P } = {
  'slash': 'slash',
  'reward': 'reward',
  'democracy-proposed': 'democracy-proposed',
  'democracy-started': 'democracy-started',
  'democracy-passed': 'democracy-passed',
  'democracy-not-passed': 'democracy-not-passed',
  'democracy-cancelled': 'democracy-cancelled',
};

export const SubstrateEventKinds: SubstrateEventKind[] = Object.values(SubstrateEventKindMap);
