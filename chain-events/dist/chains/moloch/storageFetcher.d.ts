import EthDater from 'ethereum-block-by-date';
import { CWEvent, IStorageFetcher, IDisconnectedRange } from '../../interfaces';
import { IEventData, Api } from './types';
export declare class StorageFetcher extends IStorageFetcher<Api> {
    protected readonly _api: Api;
    private readonly _version;
    private readonly _dater;
    constructor(_api: Api, _version: 1 | 2, _dater: EthDater, chain?: string);
    private _periodDuration;
    private _summoningTime;
    private _abortPeriod;
    private _votingPeriod;
    private _gracePeriod;
    private _currentBlock;
    private _currentTimestamp;
    private readonly log;
    private _isProposalV1;
    private _eventsFromProposal;
    private _initConstants;
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
    fetch(range?: IDisconnectedRange, fetchAllCompleted?: boolean): Promise<CWEvent<IEventData>[]>;
}
