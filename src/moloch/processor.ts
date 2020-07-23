/**
 * Processes Moloch events.
 */
import { IEventProcessor, CWEvent } from '../interfaces';
import { ParseType } from './filters/type_parser';
import { Enrich } from './filters/enricher';

import { IEventData, RawEvent, Api } from './types';
import { factory, formatFilename } from '../logging';
const log = factory.getLogger(formatFilename(__filename));

export class Processor extends IEventProcessor<Api, RawEvent> {
  private _version: 1 | 2;

  constructor(api: Api, contractVersion: 1 | 2) {
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
  public async process(event: RawEvent): Promise<CWEvent<IEventData>[]> {
    const kind = ParseType(this._version, event.event);
    if (!kind) return [];
    try {
      const cwEvent = await Enrich(this._version, this._api, event.blockNumber, kind, event);
      return [ cwEvent ];
    } catch (e) {
      log.error(`Failed to enrich event: ${e.message}`);
      return [];
    }
  }
}
