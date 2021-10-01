/* eslint-disable no-shadow */
import { TypedEvent } from '../../contractTypes/commons';
import { GovernorAlpha } from '../../contractTypes';

export enum ProposalState {
  Pending = 0,
  Active = 1,
  Canceled = 2,
  Defeated = 3,
  Succeeded = 4,
  Queued = 5,
  Expired = 6,
  Executed = 7,
}

export enum BravoSupport {
  Against = 0,
  For = 1,
  Abstain = 2,
}

export type Api = GovernorAlpha;

// TODO: clarify how this section works
export const EventChains = [
  'compound',
  'marlin-local',
  'marlin',
  'uniswap',
  'tribe',
] as const;

// options for the listener class
export interface ListenerOptions {
  url: string;
  skipCatchup: boolean;
  contractAddress: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type RawEvent = TypedEvent<any>;

// eslint-disable-next-line no-shadow
export enum EntityKind {
  // eslint-disable-next-line no-shadow
  Proposal = 'proposal',
}

export enum EventKind {
  ProposalExecuted = 'proposal-executed',
  ProposalCreated = 'proposal-created',
  ProposalCanceled = 'proposal-canceled',
  ProposalQueued = 'proposal-queued',
  VoteCast = 'vote-cast',
}

interface IEvent {
  kind: EventKind;
}

type Address = string;
type Balance = string; // queried as BigNumber

export interface IProposalCanceled extends IEvent {
  kind: EventKind.ProposalCanceled;
  id: number;
}

export interface IProposalCreated extends IEvent {
  kind: EventKind.ProposalCreated;
  id: number;
  proposer: Address;
  targets: Address[];
  values: Balance[];
  signatures: string[];
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
  support: number; // handle alpha and bravo support types
  votes: Balance;
  reason?: string;
}

export type IEventData =
  | IProposalCanceled
  | IProposalCreated
  | IProposalExecuted
  | IProposalQueued
  | IVoteCast;

export const EventKinds: EventKind[] = Object.values(EventKind);
