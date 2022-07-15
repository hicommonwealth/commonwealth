import { CWEvent } from '../../../interfaces';
import { EventKind, RawEvent, IEventData, Api } from '../types';
export declare function Enrich(api: Api, blockNumber: number, kind: EventKind, rawData: RawEvent): Promise<CWEvent<IEventData>>;
