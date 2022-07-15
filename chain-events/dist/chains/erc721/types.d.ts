import { Web3Provider } from '@ethersproject/providers';
import { TypedEvent } from '../../contractTypes/commons';
import { ERC721 } from '../../contractTypes';
interface IErc721Contract {
    contract: ERC721;
    tokenName?: string;
}
export interface IErc721Contracts {
    tokens: IErc721Contract[];
    provider: Web3Provider;
}
export interface ListenerOptions {
    url: string;
    tokenAddresses: string[];
    tokenNames?: string[];
}
export declare type RawEvent = TypedEvent<any>;
export declare enum EventKind {
    Approval = "approval",
    ApprovalForAll = "approval for all",
    Transfer = "transfer"
}
interface IEvent {
    kind: EventKind;
}
declare type Address = string;
declare type TokenID = string;
export interface IApproval extends IEvent {
    kind: EventKind.Approval;
    owner: Address;
    approved: Address;
    tokenId: TokenID;
    contractAddress: Address;
}
export interface IApprovalForAll extends IEvent {
    kind: EventKind.ApprovalForAll;
    owner: Address;
    operator: Address;
    approved: boolean;
    contractAddress: Address;
}
export interface ITransfer extends IEvent {
    kind: EventKind.Transfer;
    from: Address;
    to: Address;
    tokenId: TokenID;
    contractAddress: Address;
}
export declare type IEventData = IApproval | IApprovalForAll | ITransfer;
export declare const EventKinds: EventKind[];
export {};
