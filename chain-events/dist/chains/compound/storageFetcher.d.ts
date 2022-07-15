import { CWEvent, IStorageFetcher, IDisconnectedRange } from '../../interfaces';
import { IEventData, Api } from './types';
export declare class StorageFetcher extends IStorageFetcher<Api> {
    protected readonly _api: Api;
    private readonly log;
    constructor(_api: Api, chain?: string);
    private _currentBlock;
    fetchOne(id: string): Promise<CWEvent<IEventData>[]>;
    /**
     * Fetches all CW events relating to ChainEntities from chain (or in this case contract),
     *   by quering available chain/contract storage and reconstructing events.
     *
     * NOTE: throws on error! Make sure to wrap in try/catch!
     *
     * @param range Determines the range of blocks to query events within.
     * @param fetchAllCompleted
     */
    fetch(range?: IDisconnectedRange): Promise<CWEvent<IEventData>[]>;
}
