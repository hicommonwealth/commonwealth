/**
 * Processes Moloch events.
 */
import { IEventProcessor, CWEvent } from '../interfaces';
import parseEventType from './filters/type_parser';
import enrichEvent from './filters/enricher';

import { IMolochEventData, MolochRawEvent, MolochApi, molochApiVersion } from './types';
import { factory, formatFilename } from '../../logging';
const log = factory.getLogger(formatFilename(__filename));

export default class extends IEventProcessor<MolochApi, MolochRawEvent> {
  /**
   * Parse events out of an edgeware block and standardizes their format
   * for processing.
   *
   * @param block the block received for processing
   * @returns an array of processed events
   */
  public async process(event: MolochRawEvent): Promise<CWEvent<IMolochEventData>[]> {
    const kind = parseEventType(molochApiVersion(this._api), event.event);
    if (!kind) return null;
    const cwEvent = await enrichEvent(this._api, event.blockNumber, kind, event);
    return [ cwEvent ];
  }
}
