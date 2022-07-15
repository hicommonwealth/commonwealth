import { ISubscribeOptions } from '../../interfaces';
import { TypedEvent } from '../../contractTypes/commons';
import { Moloch1, Moloch2 } from '../../contractTypes';
declare type UnPromisify<T> = T extends Promise<infer U> ? U : T;
export declare type ProposalV1 = UnPromisify<ReturnType<Moloch1['functions']['proposalQueue']>>;
export declare type ProposalV2 = UnPromisify<ReturnType<Moloch2['functions']['proposals']>>;
export declare type Api = Moloch1 | Moloch2;
export declare type RawEvent = TypedEvent<any>;
export interface SubscribeOptions extends ISubscribeOptions<Api> {
    contractVersion: 1 | 2;
}
export interface ListenerOptions {
    url: string;
    skipCatchup: boolean;
    contractVersion: 1 | 2;
    contractAddress: string;
}
export declare enum EntityKind {
    Proposal = "proposal"
}
export declare enum EventKind {
    SubmitProposal = "submit-proposal",
    SubmitVote = "submit-vote",
    ProcessProposal = "process-proposal",
    Ragequit = "ragequit",
    Abort = "abort",
    UpdateDelegateKey = "update-delegate-key",
    SummonComplete = "summon-complete"
}
interface IEvent {
    kind: EventKind;
}
declare type Address = string;
declare type Balance = string;
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
export declare type IEventData = ISubmitProposal | ISubmitVote | IProcessProposal | IRagequit | IAbort | IUpdateDelegateKey | ISummonComplete;
export declare const EventKinds: EventKind[];
export {};
