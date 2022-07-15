import { ApiPromise } from '@polkadot/api';
import { RegisteredTypes } from '@polkadot/types/types';
import { IDisconnectedRange } from '../../interfaces';
import { Listener as BaseListener } from '../../Listener';
import { Block, EventKind, ISubstrateListenerOptions } from './types';
import { EnricherConfig, Processor, StorageFetcher, Subscriber } from './index';
export declare class Listener extends BaseListener<ApiPromise, StorageFetcher, Processor, Subscriber, EventKind> {
    private readonly _options;
    private _poller;
    discoverReconnectRange: (chain: string) => Promise<IDisconnectedRange>;
    protected readonly log: any;
    constructor(chain: string, url?: string, spec?: RegisteredTypes, archival?: boolean, startBlock?: number, skipCatchup?: boolean, enricherConfig?: EnricherConfig, verbose?: boolean, discoverReconnectRange?: (c: string) => Promise<IDisconnectedRange>);
    init(): Promise<void>;
    subscribe(): Promise<void>;
    private processMissedBlocks;
    getBlocks(startBlock: number, endBlock?: number): Promise<Block[]>;
    updateSpec(spec: RegisteredTypes): Promise<void>;
    updateUrl(url: string): Promise<void>;
    protected processBlock(block: Block): Promise<void>;
    get options(): ISubstrateListenerOptions;
}
