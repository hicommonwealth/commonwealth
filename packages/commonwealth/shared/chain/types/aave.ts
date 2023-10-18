// eslint-disable-next-line no-shadow
export enum EventKind {
  // governance
  ProposalCanceled = 'proposal-canceled',
  ProposalCreated = 'proposal-created',
  ProposalExecuted = 'proposal-executed',
  ProposalQueued = 'proposal-queued',
  VoteEmitted = 'vote-emitted',

  // tokens
  DelegateChanged = 'delegate-changed',
  DelegatedPowerChanged = 'delegated-power-changed',
  Transfer = 'transfer',
  Approval = 'approval',
}

interface IEvent {
  kind: EventKind;
}

type Address = string;
type Balance = string;

// eslint-disable-next-line no-shadow
export enum ProposalState {
  PENDING = 0,
  CANCELED = 1,
  ACTIVE = 2,
  FAILED = 3,
  SUCCEEDED = 4,
  QUEUED = 5,
  EXPIRED = 6,
  EXECUTED = 7,
}

// eslint-disable-next-line no-shadow
export enum DelegationType {
  VOTING_POWER = 0,
  PROPOSITION_POWER = 1,
}

// GovernorAlpha Event Interfaces
export interface IProposalCanceled extends IEvent {
  kind: EventKind.ProposalCanceled;
  id: number;
}

export interface IProposalCreated extends IEvent {
  kind: EventKind.ProposalCreated;
  id: number;
  proposer: Address;
  executor: Address;
  targets: Address[];
  values: Balance[];
  signatures: Address[];
  calldatas: string[];
  startBlock: number;
  endBlock: number;
  strategy: string;
  ipfsHash: string;
}

export interface IProposalExecuted extends IEvent {
  kind: EventKind.ProposalExecuted;
  id: number;
}

export interface IProposalQueued extends IEvent {
  kind: EventKind.ProposalQueued;
  id: number;
  executionTime: number; // timestamp
}

export interface IVoteEmitted extends IEvent {
  kind: EventKind.VoteEmitted;
  id: number;
  voter: Address;
  support: boolean;
  votingPower: Balance;
}

export interface IDelegateChanged extends IEvent {
  kind: EventKind.DelegateChanged;
  tokenAddress: Address;
  delegator: Address;
  delegatee: Address;
  type: DelegationType;
}

export interface IDelegatedPowerChanged {
  kind: EventKind.DelegatedPowerChanged;
  tokenAddress: Address;
  who: Address;
  amount: Balance;
  type: DelegationType;
}

export interface ITransfer {
  kind: EventKind.Transfer;
  tokenAddress: Address;
  from: Address;
  to: Address;
  amount: Balance;
}

export interface IApproval {
  kind: EventKind.Approval;
  tokenAddress: Address;
  owner: Address;
  spender: Address;
  amount: Balance;
}

export type IEventData =
  | IProposalCanceled
  | IProposalCreated
  | IProposalExecuted
  | IProposalQueued
  | IVoteEmitted
  | IDelegateChanged
  | IDelegatedPowerChanged
  | ITransfer
  | IApproval;
