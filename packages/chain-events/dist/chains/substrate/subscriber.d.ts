/**
 * Fetches events from substrate chain in real time.
 */
import { ApiPromise } from '@polkadot/api';
import { IEventSubscriber } from '../../interfaces';
import { Block } from './types';
export declare class Subscriber extends IEventSubscriber<ApiPromise, Block> {
    protected readonly _api: ApiPromise;
    protected _verbose: boolean;
    private _subscription;
    private _versionName;
    private _versionNumber;
    protected readonly log: any;
    constructor(_api: ApiPromise, _verbose?: boolean, chain?: string);
    /**
     * Initializes subscription to chain and starts emitting events.
     */
    subscribe(cb: (block: Block) => void): Promise<void>;
    unsubscribe(): void;
}
