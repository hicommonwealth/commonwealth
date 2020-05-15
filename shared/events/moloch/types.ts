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
  // ignoring SummonComplete
  // TODO: add V2s as needed
}

interface IMolochEvent {
  kind: MolochEventKind;
}

// TODO: populate these with data members
export interface IMolochSubmitProposal extends IMolochEvent {
  kind: MolochEventKind.SubmitProposal;
}

export interface IMolochSubmitVote extends IMolochEvent {
  kind: MolochEventKind.SubmitVote;
}

export interface IMolochProcessProposal extends IMolochEvent {
  kind: MolochEventKind.ProcessProposal;
}

export interface IMolochRagequit extends IMolochEvent {
  kind: MolochEventKind.Ragequit;
}

export interface IMolochAbort extends IMolochEvent {
  kind: MolochEventKind.Abort;
}

export interface IMolochUpdateDelegateKey extends IMolochEvent {
  kind: MolochEventKind.UpdateDelegateKey;
}

export type IMolochEventData =
  IMolochSubmitProposal
  | IMolochSubmitVote
  | IMolochProcessProposal
  | IMolochRagequit
  | IMolochAbort
  | IMolochUpdateDelegateKey
// eslint-disable-next-line semi-style
;

export const MolochEventKinds: MolochEventKind[] = Object.values(MolochEventKind);
