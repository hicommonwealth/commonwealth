import { IDisconnectedRange } from '../../interfaces';
import { Listener as BaseListener } from '../../Listener';
import { Api, EventKind, ListenerOptions as MolochListenerOptions, RawEvent } from './types';
import { Processor, StorageFetcher, Subscriber } from '.';
export declare class Listener extends BaseListener<Api, StorageFetcher, Processor, Subscriber, EventKind> {
    private readonly _options;
    protected readonly log: any;
    constructor(chain: string, contractVersion?: 1 | 2, contractAddress?: string, url?: string, skipCatchup?: boolean, verbose?: boolean, discoverReconnectRange?: (c: string) => Promise<IDisconnectedRange>);
    init(): Promise<void>;
    subscribe(): Promise<void>;
    protected processBlock(event: RawEvent): Promise<void>;
    private processMissedBlocks;
    updateContractVersion(version: 1 | 2): Promise<void>;
    updateContractAddress(address: string): Promise<void>;
    get options(): MolochListenerOptions;
}
