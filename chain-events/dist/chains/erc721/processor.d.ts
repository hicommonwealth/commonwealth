/**
 * Processes ERC721 events.
 */
import { IEventProcessor, CWEvent } from '../../interfaces';
import { IEventData, RawEvent, IErc721Contracts } from './types';
export declare class Processor extends IEventProcessor<IErc721Contracts, RawEvent> {
    protected _api: IErc721Contracts;
    constructor(_api: IErc721Contracts);
    /**
     * Parse events out of an ethereum block and standardizes their format
     * for processing.
     * @param event
     * @param tokenName
     * @returns an array of processed events
     */
    process(event: RawEvent, tokenName?: string): Promise<CWEvent<IEventData>[]>;
}
