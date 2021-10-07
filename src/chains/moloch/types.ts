import { ISubscribeOptions } from '../../interfaces';
import { TypedEvent } from '../../contractTypes/commons';
import { Moloch1, Moloch2 } from '../../contractTypes';

type UnPromisify<T> = T extends Promise<infer U> ? U : T;
export type ProposalV1 = UnPromisify<
  ReturnType<Moloch1['functions']['proposalQueue']>
>;
export type ProposalV2 = UnPromisify<
  ReturnType<Moloch2['functions']['proposals']>
>;

export type Api = Moloch1 | Moloch2;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type RawEvent = TypedEvent<any>;

export interface SubscribeOptions extends ISubscribeOptions<Api> {
  contractVersion: 1 | 2;
}

export interface ListenerOptions {
  url: string;
  skipCatchup: boolean;
  contractVersion: 1 | 2;
  contractAddress: string;
}

// eslint-disable-next-line no-shadow
export enum EntityKind {
  Proposal = 'proposal',
}

// eslint-disable-next-line no-shadow
export enum EventKind {
  SubmitProposal = 'submit-proposal',
  SubmitVote = 'submit-vote',
  ProcessProposal = 'process-proposal',
  Ragequit = 'ragequit',
  Abort = 'abort',
  UpdateDelegateKey = 'update-delegate-key',
  SummonComplete = 'summon-complete',
  // TODO: add V2s as needed
}

interface IEvent {
  kind: EventKind;
}

type Address = string;
type Balance = string;

// TODO: populate these with data members
export interface ISubmitProposal extends IEvent {
  kind: EventKind.SubmitProposal;
  proposalIndex: number;
  delegateKey?: Address;
  member: Address;
  applicant: Address;
  tokenTribute: Balance;
  sharesRequested: Balance;
  details: string;
  startTime: number;
}

export interface ISubmitVote extends IEvent {
  kind: EventKind.SubmitVote;
  proposalIndex: number;
  delegateKey: Address;
  member: Address;
  vote: number;
  shares: string;
  highestIndexYesVote: number;
}

export interface IProcessProposal extends IEvent {
  kind: EventKind.ProcessProposal;
  proposalIndex: number;
  applicant: Address;
  member: Address;
  tokenTribute: Balance;
  sharesRequested: Balance;
  didPass: boolean;
  yesVotes: string;
  noVotes: string;
}

export interface IRagequit extends IEvent {
  kind: EventKind.Ragequit;
  member: Address;
  sharesToBurn: Balance;
}

export interface IAbort extends IEvent {
  kind: EventKind.Abort;
  proposalIndex: number;
  applicant: Address;
}

export interface IUpdateDelegateKey extends IEvent {
  kind: EventKind.UpdateDelegateKey;
  member: Address;
  newDelegateKey: Address;
}

export interface ISummonComplete extends IEvent {
  kind: EventKind.SummonComplete;
  summoner: Address;
  shares: Balance;
}

export type IEventData =
  | ISubmitProposal
  | ISubmitVote
  | IProcessProposal
  | IRagequit
  | IAbort
  | IUpdateDelegateKey
  | ISummonComplete;
// eslint-disable-next-line semi-style

export const EventKinds: EventKind[] = Object.values(EventKind);
