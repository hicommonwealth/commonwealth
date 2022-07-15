/**
 * Processes Moloch events.
 */
import { IEventProcessor, CWEvent } from '../../interfaces';
import { IEventData, RawEvent, Api } from './types';
export declare class Processor extends IEventProcessor<Api, RawEvent> {
    protected readonly chain?: string;
    private readonly _version;
    constructor(api: Api, contractVersion: 1 | 2, chain?: string);
    /**
     * Parse events out of an edgeware block and standardizes their format
     * for processing.
     * @param event
     * @returns an array of processed events
     */
    process(event: RawEvent): Promise<CWEvent<IEventData>[]>;
}
