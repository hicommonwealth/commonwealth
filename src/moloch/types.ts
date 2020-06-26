import { Event } from 'ethers';
import { ISubscribeOptions } from '../interfaces';
import { Moloch1 } from '../../eth/types/Moloch1';
import { Moloch2 } from '../../eth/types/Moloch2';

type UnPromisify<T> = T extends Promise<infer U> ? U : T;
export type Moloch1Proposal = UnPromisify<ReturnType<Moloch1['functions']['proposalQueue']>>;
export type Moloch2Proposal = UnPromisify<ReturnType<Moloch2['functions']['proposals']>>;

export type MolochApi = Moloch1 | Moloch2;

export const MolochEventChains = [ 'moloch', 'moloch-local' ];

export type MolochRawEvent = Event;

export interface IMolochSubscribeOptions extends ISubscribeOptions<MolochApi> {
  contractVersion: 1 | 2;
}

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
  delegateKey?: Address;
  member: Address;
  applicant: Address;
  tokenTribute: Balance;
  sharesRequested: Balance;
  details: string;
  startTime: number;
}

export interface IMolochSubmitVote extends IMolochEvent {
  kind: MolochEventKind.SubmitVote;
  proposalIndex: number;
  delegateKey: Address;
  member: Address;
  vote: number;
  shares: string;
  highestIndexYesVote: number;
}

export interface IMolochProcessProposal extends IMolochEvent {
  kind: MolochEventKind.ProcessProposal;
  proposalIndex: number;
  applicant: Address;
  member: Address;
  tokenTribute: Balance;
  sharesRequested: Balance;
  didPass: boolean;
  yesVotes: string;
  noVotes: string;
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
