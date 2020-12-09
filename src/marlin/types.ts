import { Event } from 'ethers';
import { BigNumber, BigNumberish } from 'ethers/utils';
import { compact } from 'underscore';
import { ISubscribeOptions } from '../interfaces';
import { MPond } from './contractTypes/MPond';
import { GovernorAlpha } from './contractTypes/GovernorAlpha';
import { Timelock } from './contractTypes/Timelock';

// Used to unwrap promises returned by contract functions
type UnPromisify<T> = T extends Promise<infer U> ? U : T;
export type Proposal = UnPromisify<ReturnType<GovernorAlpha['functions']['proposals']>>
export type Receipt = UnPromisify<ReturnType<GovernorAlpha['functions']['getReceipt']>>

// API is imported contracts classes
interface IMarlinContracts {
  comp: MPond;
  governorAlpha: GovernorAlpha;
  timelock: Timelock;
};

export type Api = IMarlinContracts;

export const EventChains = ['marlin', 'marlin-local'] as const;

export type RawEvent = Event;

export enum EntityKind {
  Proposal = 'proposal',
}

export enum EventKind {
  // Comp Events
  Approval = 'approval',
  DelegateChanged = 'delegate-changed',
  DelegateVotesChanged = 'delegate-votes-changed',
  Transfer = 'transfer',
  // GovernorAlpha Events
  ProposalExecuted = 'proposal-executed',
  ProposalCreated = 'proposal-created',
  ProposalCanceled = 'proposal-canceled',
  ProposalQueued = 'proposal-queued',
  VoteCast = 'vote-cast',
  // Timelock Events
  CancelTransaction = 'cancel-transaction',
  ExecuteTransaction = 'execute-transactions',
  NewAdmin = 'new-admin',
  NewDelay = 'new-delay',
  NewPendingAdmin = 'new-pending-admin',
  QueueTransaction = 'queue-transaction',
}

interface IEvent {
  kind: EventKind;
}

type Address = string;
type Balance = string; // number???

// Comp Event Interfaces
export interface IApproval extends IEvent {
  kind: EventKind.Approval;
  owner: Address;
  spender: Address;
  amount: Balance;
}

export interface IDelegateChanged extends IEvent {
  kind: EventKind.DelegateChanged;
  delegator: Address;
  fromDelegate: Address;
  toDelegate: Address;
}

export interface IDelegateVotesChanged extends IEvent {
  kind: EventKind.DelegateVotesChanged;
  delegate: Address;
  previousBalance: Balance;
  newBalance: Balance;
}

export interface ITransfer extends IEvent {
  kind: EventKind.Transfer;
  from: Address;
  to: Address;
  amount: Balance;
}

// GovernorAlpha Event Interfaces
export interface IProposalCanceled extends IEvent {
  kind: EventKind.ProposalCanceled;
  id: number;
}

export interface IProposalCreated extends IEvent {
  kind: EventKind.ProposalCreated;
  id: number;
  proposer?: Address;
  targets?: Address[];
  values: string[];
  signatures: Address[];
  calldatas: string[];
  startBlock: number;
  endBlock: number;
  description: string;
}

export interface IProposalExecuted extends IEvent {
  kind: EventKind.ProposalExecuted;
  id: number;
}

export interface IProposalQueued extends IEvent {
  kind: EventKind.ProposalQueued;
  id: number;
  eta: number;
}

export interface IVoteCast extends IEvent {
  kind: EventKind.VoteCast;
  voter: Address;
  id: number;
  support: boolean;
  votes: Balance;
}


// Timelock Event Interfaces
export interface ICancelTransaction extends IEvent {
  kind: EventKind.CancelTransaction;
  txHash: string;
  target: Address;
  value: Balance;
  signature: string;
  data: string;
  eta: number;
}

export interface IExecuteTransaction extends IEvent {
  kind: EventKind.ExecuteTransaction;
  txHash: string;
  target: Address;
  value: Balance;
  signature: string;
  data: string;
  eta: number;
}

export interface INewAdmin extends IEvent {
  kind: EventKind.NewAdmin;
  newAdmin: Address;
}

export interface INewDelay extends IEvent {
  kind: EventKind.NewDelay;
  newDelay: number;
}

export interface INewPendingAdmin extends IEvent {
  kind: EventKind.NewPendingAdmin;
  newPendingAdmin: Address;
}

export interface IQueueTransaction extends IEvent {
  kind: EventKind.QueueTransaction;
  txHash: string;
  target: Address;
  value: Balance;
  signature: string;
  data: string;
  eta: number;
}

export type IEventData =
  // Comp
  IApproval
  | IDelegateChanged
  | IDelegateVotesChanged
  | ITransfer
  // GovernorAlpha
  | IProposalCanceled
  | IProposalCreated
  | IProposalExecuted
  | IProposalQueued
  | IVoteCast
  // Timelock
  | ICancelTransaction
  | IExecuteTransaction
  | INewAdmin
  | INewDelay
  | INewPendingAdmin
  | IQueueTransaction
  // eslint-disable-next-line semi-style
;

export const EventKinds: EventKind[] = Object.values(EventKind);