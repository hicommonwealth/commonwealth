import { Web3Provider } from '@ethersproject/providers';
import BN from 'bn.js';
import { TypedEvent } from '../../contractTypes/commons';
import { ERC20 } from '../../contractTypes';
import { EnricherConfig } from './filters/enricher';
interface IErc20Contract {
    contract: ERC20;
    totalSupply: BN;
    tokenName?: string;
}
export interface IErc20Contracts {
    tokens: IErc20Contract[];
    provider: Web3Provider;
}
export interface ListenerOptions {
    url: string;
    tokenAddresses: string[];
    tokenNames?: string[];
    enricherConfig: EnricherConfig;
}
export declare type RawEvent = TypedEvent<any>;
export declare enum EventKind {
    Approval = "approval",
    Transfer = "transfer"
}
interface IEvent {
    kind: EventKind;
}
declare type Address = string;
declare type Balance = string;
export interface IApproval extends IEvent {
    kind: EventKind.Approval;
    owner: Address;
    spender: Address;
    value: Balance;
    contractAddress: Address;
}
export interface ITransfer extends IEvent {
    kind: EventKind.Transfer;
    from: Address;
    to: Address;
    value: Balance;
    contractAddress: Address;
}
export declare type IEventData = IApproval | ITransfer;
export declare const EventKinds: EventKind[];
export {};
