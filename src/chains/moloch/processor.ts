/**
 * Processes Moloch events.
 */
import { IEventProcessor, CWEvent, SupportedNetwork } from '../../interfaces';
import { addPrefix, factory } from '../../logging';

import { ParseType } from './filters/type_parser';
import { Enrich } from './filters/enricher';
import { IEventData, RawEvent, Api } from './types';

export class Processor extends IEventProcessor<Api, RawEvent> {
  private readonly _version: 1 | 2;

  constructor(
    api: Api,
    contractVersion: 1 | 2,
    protected readonly chain?: string
  ) {
    super(api);
    this._version = contractVersion;
  }

  /**
   * Parse events out of an edgeware block and standardizes their format
   * for processing.
   * @param event
   * @returns an array of processed events
   */
  public async process(event: RawEvent): Promise<CWEvent<IEventData>[]> {
    const log = factory.getLogger(
      addPrefix(__filename, [SupportedNetwork.Moloch, this.chain])
    );
    const kind = ParseType(this._version, event.event, this.chain);
    if (!kind) return [];
    try {
      const cwEvent = await Enrich(
        this._version,
        this._api,
        event.blockNumber,
        kind,
        event
      );
      return [cwEvent];
    } catch (e) {
      log.error(
        `Failed to enrich event. Block number: ${event.blockNumber}, Name/Kind: ${event.event}, Error Message: ${e.message}`
      );
      return [];
    }
  }
}
