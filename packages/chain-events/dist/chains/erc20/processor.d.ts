/**
 * Processes ERC20 events.
 */
import { IEventProcessor, CWEvent } from '../../interfaces';
import { EnricherConfig } from './filters/enricher';
import { IEventData, RawEvent, IErc20Contracts } from './types';
export declare class Processor extends IEventProcessor<IErc20Contracts, RawEvent> {
    protected _api: IErc20Contracts;
    private _enricherConfig;
    constructor(_api: IErc20Contracts, _enricherConfig?: EnricherConfig);
    /**
     * Parse events out of an ethereum block and standardizes their format
     * for processing.
     * @param event
     * @param tokenName
     * @returns an array of processed events
     */
    process(event: RawEvent, tokenName?: string): Promise<CWEvent<IEventData>[]>;
}
