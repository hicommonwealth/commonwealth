import { CWEvent } from '../../../interfaces';
import { EventKind, RawEvent, IEventData, IErc721Contracts } from '../types';
export declare function Enrich(api: IErc721Contracts, blockNumber: number, kind: EventKind, rawData: RawEvent): Promise<CWEvent<IEventData>>;
