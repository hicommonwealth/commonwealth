import { IEventHandler, IChainEventKind, IEventSubscriber, IEventProcessor, IChainEventData, CWEvent, IStorageFetcher, IDisconnectedRange, SupportedNetwork } from './interfaces';
export declare abstract class Listener<Api, StorageFetcher extends IStorageFetcher<Api>, Processor extends IEventProcessor<Api, any>, Subscriber extends IEventSubscriber<Api, any>, EventKind extends IChainEventKind> {
    eventHandlers: {
        [key: string]: {
            handler: IEventHandler;
            excludedEvents: EventKind[];
        };
    };
    globalExcludedEvents: EventKind[];
    storageFetcher: StorageFetcher;
    discoverReconnectRange: (chain: string) => Promise<IDisconnectedRange>;
    protected _subscriber: Subscriber;
    protected _processor: Processor;
    protected _api: Api;
    protected _subscribed: boolean;
    protected _lastBlockNumber: number;
    protected readonly _chain: string;
    protected readonly _verbose: boolean;
    protected constructor(network: SupportedNetwork, chain: string, verbose?: boolean);
    abstract init(): Promise<void>;
    abstract subscribe(): Promise<void>;
    unsubscribe(): Promise<void>;
    protected handleEvent(event: CWEvent<IChainEventData>): Promise<void>;
    protected abstract processBlock(block: any): Promise<void>;
    get chain(): string;
    get subscribed(): boolean;
    abstract get options(): any;
    get lastBlockNumber(): number;
}
