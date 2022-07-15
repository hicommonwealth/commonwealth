import { TypedEvent } from '../../contractTypes/commons';
import { GovernorAlpha, GovernorCompatibilityBravo } from '../../contractTypes';
export declare enum ProposalState {
    Pending = 0,
    Active = 1,
    Canceled = 2,
    Defeated = 3,
    Succeeded = 4,
    Queued = 5,
    Expired = 6,
    Executed = 7
}
export declare enum BravoSupport {
    Against = 0,
    For = 1,
    Abstain = 2
}
export declare type Api = GovernorAlpha | GovernorCompatibilityBravo;
export declare function isGovernorAlpha(a: Api): a is GovernorAlpha;
export interface ListenerOptions {
    url: string;
    skipCatchup: boolean;
    contractAddress: string;
}
export declare type RawEvent = TypedEvent<any>;
export declare enum EntityKind {
    Proposal = "proposal"
}
export declare enum EventKind {
    ProposalExecuted = "proposal-executed",
    ProposalCreated = "proposal-created",
    ProposalCanceled = "proposal-canceled",
    ProposalQueued = "proposal-queued",
    VoteCast = "vote-cast"
}
interface IEvent {
    kind: EventKind;
}
declare type Address = string;
declare type Balance = string;
export interface IProposalCanceled extends IEvent {
    kind: EventKind.ProposalCanceled;
    id: string;
}
export interface IProposalCreated extends IEvent {
    kind: EventKind.ProposalCreated;
    id: string;
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
    id: string;
}
export interface IProposalQueued extends IEvent {
    kind: EventKind.ProposalQueued;
    id: string;
    eta: number;
}
export interface IVoteCast extends IEvent {
    kind: EventKind.VoteCast;
    voter: Address;
    id: string;
    support: number;
    votes: Balance;
    reason?: string;
}
export declare type IEventData = IProposalCanceled | IProposalCreated | IProposalExecuted | IProposalQueued | IVoteCast;
export declare const EventKinds: EventKind[];
export {};
