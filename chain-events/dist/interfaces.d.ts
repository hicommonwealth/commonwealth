/**
 * Defines general interfaces for chain event fetching and processing.
 */
import * as SubstrateTypes from './chains/substrate/types';
import * as MolochTypes from './chains/moloch/types';
import * as CompoundTypes from './chains/compound/types';
import * as Erc20Types from './chains/erc20/types';
import * as Erc721Types from './chains/erc721/types';
import * as AaveTypes from './chains/aave/types';
import * as CommonwealthTypes from './chains/commonwealth/types';
export declare type IChainEntityKind = SubstrateTypes.EntityKind | MolochTypes.EntityKind | CompoundTypes.EntityKind | AaveTypes.EntityKind | CommonwealthTypes.EntityKind;
export declare type IChainEventData = SubstrateTypes.IEventData | MolochTypes.IEventData | CompoundTypes.IEventData | AaveTypes.IEventData | Erc20Types.IEventData | Erc721Types.IEventData | CommonwealthTypes.IEventData;
export declare type IChainEventKind = SubstrateTypes.EventKind | MolochTypes.EventKind | CompoundTypes.EventKind | AaveTypes.EventKind | Erc20Types.EventKind | Erc721Types.EventKind | CommonwealthTypes.EventKind;
export declare const ChainEventKinds: (SubstrateTypes.EventKind | MolochTypes.EventKind | CompoundTypes.EventKind | AaveTypes.EventKind | Erc20Types.EventKind | Erc721Types.EventKind | CommonwealthTypes.EventKind)[];
export declare enum SupportedNetwork {
    Substrate = "substrate",
    Aave = "aave",
    Compound = "compound",
    Moloch = "moloch",
    ERC20 = "erc20",
    ERC721 = "erc721",
    Commonwealth = "commonwealth"
}
export declare enum EntityEventKind {
    Create = 0,
    Update = 1,
    Vote = 2,
    Complete = 3
}
export interface CWEvent<IEventData = IChainEventData> {
    blockNumber: number;
    includeAddresses?: string[];
    excludeAddresses?: string[];
    data: IEventData;
    network: SupportedNetwork;
    chain?: string;
    received?: number;
}
export declare abstract class IEventHandler<DBEventType = IChainEventData> {
    abstract handle(event: CWEvent, dbEvent?: DBEventType): Promise<DBEventType>;
}
export declare abstract class IEventProcessor<Api, RawEvent> {
    protected _api: Api;
    constructor(_api: Api);
    abstract process(block: RawEvent): Promise<CWEvent[]>;
}
export declare abstract class IEventSubscriber<Api, RawEvent> {
    protected _api: Api;
    protected _verbose: boolean;
    constructor(_api: Api, _verbose?: boolean);
    get api(): Api;
    abstract subscribe(cb: (event: RawEvent) => void): Promise<void>;
    abstract unsubscribe(): void;
}
export interface IDisconnectedRange {
    startBlock?: number;
    endBlock?: number;
    maxResults?: number;
}
export interface ISubscribeOptions<Api> {
    chain: string;
    api: Api;
    handlers: IEventHandler<IChainEventData>[];
    skipCatchup?: boolean;
    archival?: boolean;
    startBlock?: number;
    discoverReconnectRange?: () => Promise<IDisconnectedRange>;
    verbose?: boolean;
}
export declare type SubscribeFunc<Api, RawEvent, Options extends ISubscribeOptions<Api>> = (options: Options) => Promise<IEventSubscriber<Api, RawEvent>>;
export declare abstract class IStorageFetcher<Api> {
    protected _api: Api;
    constructor(_api: Api);
    abstract fetch(range?: IDisconnectedRange, fetchAllCompleted?: boolean): Promise<CWEvent[]>;
    abstract fetchOne(id: string, kind?: IChainEntityKind): Promise<CWEvent[]>;
}
export declare abstract class IEventPoller<Api, RawEvent> {
    protected _api: Api;
    constructor(_api: Api);
    abstract poll(range: IDisconnectedRange, maxRange?: number): Promise<RawEvent[]>;
}
export interface IEventLabel {
    heading: string;
    label: string;
    linkUrl?: string;
}
export declare type LabelerFilter = (blockNumber: number, chainId: string, data: IChainEventData, ...formatters: any[]) => IEventLabel;
export interface IEventTitle {
    title: string;
    description: string;
}
export declare type TitlerFilter = (kind: IChainEventKind) => IEventTitle;
export declare function entityToFieldName(network: SupportedNetwork, entity: IChainEntityKind): string | null;
export declare function eventToEntity(network: SupportedNetwork, event: IChainEventKind): [IChainEntityKind, EntityEventKind];
export declare function isEntityCompleted(entityEvents: CWEvent[]): boolean;
