import { Listener as BaseListener } from '../../Listener';
import { IDisconnectedRange } from '../../interfaces';
import { Api, EventKind, ListenerOptions as CommonwealthListenerOptions, RawEvent } from './types';
import { Subscriber } from './subscriber';
import { Processor } from './processor';
import { StorageFetcher } from './storageFetcher';
export declare class Listener extends BaseListener<Api, StorageFetcher, Processor, Subscriber, EventKind> {
    discoverReconnectRange: (chain: string) => Promise<IDisconnectedRange>;
    private readonly _options;
    protected readonly log: any;
    constructor(chain: string, contractAddress: string, url?: string, skipCatchup?: boolean, verbose?: boolean, discoverReconnectRange?: (c: string) => Promise<IDisconnectedRange>);
    init(): Promise<void>;
    subscribe(): Promise<void>;
    updateAddress(): Promise<void>;
    private processMissedBlocks;
    protected processBlock(event: RawEvent): Promise<void>;
    get options(): CommonwealthListenerOptions;
}
