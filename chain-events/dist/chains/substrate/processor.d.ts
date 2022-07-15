/**
 * Processes substrate blocks and emits events.
 */
import { ApiPromise } from '@polkadot/api';
import { IEventProcessor, CWEvent } from '../../interfaces';
import { Block, IEventData } from './types';
import { EnricherConfig } from './filters/enricher';
export declare class Processor extends IEventProcessor<ApiPromise, Block> {
    protected _api: ApiPromise;
    private _enricherConfig;
    protected readonly chain?: string;
    constructor(_api: ApiPromise, _enricherConfig?: EnricherConfig, chain?: string);
    private _lastBlockNumber;
    get lastBlockNumber(): number;
    /**
     * Parse events out of an substrate block and standardizes their format
     * for processing.
     *
     * @param block the block received for processing
     * @returns an array of processed events
     */
    process(block: Block): Promise<CWEvent<IEventData>[]>;
}
