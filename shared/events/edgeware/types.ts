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

export interface ISubstrateSlash {
  kind: 'slash';
  validator: SubstrateAccountId;
  amount: SubstrateBalanceString;
}

export interface ISubstrateReward {
  kind: 'reward';
  validator?: SubstrateAccountId;
  amount: SubstrateBalanceString;
}

export interface ISubstrateBonded {
  kind: 'bonded';
  stash: SubstrateAccountId;
  amount: SubstrateBalanceString;
  controller: SubstrateAccountId;
}

export interface ISubstrateUnbonded {
  kind: 'unbonded';
  stash: SubstrateAccountId;
  amount: SubstrateBalanceString;
  controller: SubstrateAccountId;
}

export interface ISubstrateVoteDelegated {
  kind: 'vote-delegated';
  who: SubstrateAccountId;
  target: SubstrateAccountId;
}

export interface ISubstrateDemocracyProposed {
  kind: 'democracy-proposed';
  proposalIndex: number;
  deposit: SubstrateBalanceString;
  proposer: SubstrateAccountId;
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

export interface ISubstrateDemocracyExecuted {
  kind: 'democracy-executed';
  referendumIndex: number;
  executionOk: boolean;
}

export interface ISubstrateTreasuryProposed {
  kind: 'treasury-proposed';
  proposalIndex: number;
  proposer: SubstrateAccountId;
  value: SubstrateBalanceString;
  beneficiary: SubstrateAccountId;
  // can also fetch bond if needed
}

export interface ISubstrateTreasuryAwarded {
  kind: 'treasury-awarded';
  proposalIndex: number;
  value: SubstrateBalanceString;
  beneficiary: SubstrateAccountId;
}

export interface ISubstrateTreasuryRejected {
  kind: 'treasury-rejected';
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

export type SubstrateEventKind = ISubstrateEventData[keyof ISubstrateEventData];

export const SubstrateEventKindMap: { [P in SubstrateEventKind]: P } = {
  'slash': 'slash',
  'reward': 'reward',
  'bonded': 'bonded',
  'unbonded': 'unbonded',
  'vote-delegated': 'vote-delegated',
  'democracy-proposed': 'democracy-proposed',
  'democracy-started': 'democracy-started',
  'democracy-passed': 'democracy-passed',
  'democracy-not-passed': 'democracy-not-passed',
  'democracy-cancelled': 'democracy-cancelled',
  'democracy-executed': 'democracy-executed',
  'treasury-proposed': 'treasury-proposed',
  'treasury-awarded': 'treasury-awarded',
  'treasury-rejected': 'treasury-rejected',
};

export const SubstrateEventKinds: SubstrateEventKind[] = Object.values(SubstrateEventKindMap);
