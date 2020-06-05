import { Event } from 'ethers';

export const MolochEventChains = [ 'moloch', 'moloch-local' ];

export type MolochRawEvent = Event;

export enum MolochEntityKind {
  Proposal = 'proposal',
}

export enum MolochEventKind {
  SubmitProposal = 'submit-proposal',
  SubmitVote = 'submit-vote',
  ProcessProposal = 'process-proposal',
  Ragequit = 'ragequit',
  Abort = 'abort',
  UpdateDelegateKey = 'update-delegate-key',
  SummonComplete = 'summon-complete',
  // TODO: add V2s as needed
}

interface IMolochEvent {
  kind: MolochEventKind;
}

type Address = string;
type Balance = string;

// TODO: populate these with data members
export interface IMolochSubmitProposal extends IMolochEvent {
  kind: MolochEventKind.SubmitProposal;
  proposalIndex: number;
  delegateKey: Address;
  member: Address;
  applicant: Address;
  tokenTribute: Balance;
  sharesRequested: Balance;
}

export interface IMolochSubmitVote extends IMolochEvent {
  kind: MolochEventKind.SubmitVote;
  proposalIndex: number;
  delegateKey: Address;
  member: Address;
  vote: number;
}

export interface IMolochProcessProposal extends IMolochEvent {
  kind: MolochEventKind.ProcessProposal;
  proposalIndex: number;
  applicant: Address;
  member: Address;
  tokenTribute: Balance;
  sharesRequested: Balance;
  didPass: boolean;
}

export interface IMolochRagequit extends IMolochEvent {
  kind: MolochEventKind.Ragequit;
  member: Address;
  sharesToBurn: Balance;
}

export interface IMolochAbort extends IMolochEvent {
  kind: MolochEventKind.Abort;
  proposalIndex: number;
  applicant: Address;
}

export interface IMolochUpdateDelegateKey extends IMolochEvent {
  kind: MolochEventKind.UpdateDelegateKey;
  member: Address;
  newDelegateKey: Address;
}

export interface IMolochSummonComplete extends IMolochEvent {
  kind: MolochEventKind.SummonComplete;
  summoner: Address;
  shares: Balance;
}

export type IMolochEventData =
  IMolochSubmitProposal
  | IMolochSubmitVote
  | IMolochProcessProposal
  | IMolochRagequit
  | IMolochAbort
  | IMolochUpdateDelegateKey
  | IMolochSummonComplete
// eslint-disable-next-line semi-style
;

export const MolochEventKinds: MolochEventKind[] = Object.values(MolochEventKind);
