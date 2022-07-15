import { IDisconnectedRange } from '../../interfaces';
import { Listener as BaseListener } from '../../Listener';
import { Api, EventKind, ListenerOptions as CompoundListenerOptions, RawEvent } from './types';
import { Processor } from './processor';
import { StorageFetcher } from './storageFetcher';
import { Subscriber } from './subscriber';
export declare class Listener extends BaseListener<Api, StorageFetcher, Processor, Subscriber, EventKind> {
    private readonly _options;
    protected readonly log: any;
    constructor(chain: string, contractAddress: string, url?: string, skipCatchup?: boolean, verbose?: boolean, discoverReconnectRange?: (c: string) => Promise<IDisconnectedRange>);
    init(): Promise<void>;
    subscribe(): Promise<void>;
    updateContractAddress(address: string): Promise<void>;
    protected processBlock(event: RawEvent): Promise<void>;
    private processMissedBlocks;
    get options(): CompoundListenerOptions;
}
