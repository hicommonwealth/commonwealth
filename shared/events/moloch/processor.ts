/**
 * Processes Moloch events.
 */
import { IEventProcessor, CWEvent } from '../interfaces';
import parseEventType from './filters/type_parser';
import enrichEvent from './filters/enricher';

import { IMolochEventData, MolochRawEvent, MolochApi } from './types';
import { factory, formatFilename } from '../../logging';
const log = factory.getLogger(formatFilename(__filename));

export default class extends IEventProcessor<MolochApi, MolochRawEvent> {
  private _version: 1 | 2;

  constructor(api: MolochApi, contractVersion: 1 | 2) {
    super(api);
    this._version = contractVersion;
  }

  /**
   * Parse events out of an edgeware block and standardizes their format
   * for processing.
   *
   * @param block the block received for processing
   * @returns an array of processed events
   */
  public async process(event: MolochRawEvent): Promise<CWEvent<IMolochEventData>[]> {
    const kind = parseEventType(this._version, event.event);
    if (!kind) return [];
    try {
      const cwEvent = await enrichEvent(this._version, this._api, event.blockNumber, kind, event);
      return [ cwEvent ];
    } catch (e) {
      log.error(`Failed to enrich event: ${e.message}`);
      return [];
    }
  }
}
