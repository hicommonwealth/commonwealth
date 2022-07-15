import { ApiPromise } from '@polkadot/api';
import { Event, Extrinsic } from '@polkadot/types/interfaces';
import { CWEvent } from '../../../interfaces';
import { EventKind, IEventData } from '../types';
export interface EnricherConfig {
    balanceTransferThresholdPermill?: number;
}
/**
 * This is an "enricher" function, whose goal is to augment the initial event data
 * received from the "system.events" query with additional useful information, as
 * described in the event's interface in our "types.ts" file.
 *
 * Once fetched, the function marshalls the event data and the additional information
 * into the interface, and returns a fully-formed event, ready for database storage.
 */
export declare function Enrich(api: ApiPromise, blockNumber: number, kind: EventKind, rawData: Event | Extrinsic, config?: EnricherConfig): Promise<CWEvent<IEventData>>;
