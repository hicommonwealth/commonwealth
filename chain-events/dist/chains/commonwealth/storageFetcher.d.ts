import { CWEvent, IStorageFetcher, IDisconnectedRange } from '../../interfaces';
import { Api, IProjectCreated, IProjectCurated, IProjectBacked, IProjectFailed, IProjectSucceeded, IProjectWithdraw } from './types';
declare type IEntityEventData = IProjectCreated | IProjectCurated | IProjectBacked | IProjectFailed | IProjectSucceeded | IProjectWithdraw;
export declare class StorageFetcher extends IStorageFetcher<Api> {
    protected readonly _api: Api;
    protected readonly log: any;
    protected readonly chain: any;
    constructor(_api: Api, chain?: string);
    private _currentBlock;
    fetchOne(id: string): Promise<CWEvent<IEntityEventData>[]>;
    /**
     * Fetches all CW events relating to ChainEntities from chain (or in this case contract),
     *   by quering available chain/contract storage and reconstructing events.
     *
     * NOTE: throws on error! Make sure to wrap in try/catch!
     *
     * @param range Determines the range of blocks to query events within.
     */
    fetch(range?: IDisconnectedRange): Promise<CWEvent<IEntityEventData>[]>;
}
export {};
