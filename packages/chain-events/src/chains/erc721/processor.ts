/**
 * Processes ERC721 events.
 */
import type { CWEvent } from '../../interfaces';
import { IEventProcessor, SupportedNetwork } from '../../interfaces';
import { addPrefix, factory } from '../../logging';

import { ParseType } from './filters/type_parser';
import { Enrich } from './filters/enricher';
import type { IEventData, RawEvent, IErc721Contracts } from './types';

export class Processor extends IEventProcessor<IErc721Contracts, RawEvent> {
  constructor(protected _api: IErc721Contracts) {
    super(_api);
  }

  /**
   * Parse events out of an ethereum block and standardizes their format
   * for processing.
   * @param event
   * @param tokenName
   * @returns an array of processed events
   */
  public async process(
    event: RawEvent,
    tokenName?: string
  ): Promise<CWEvent<IEventData>[]> {
    const log = factory.getLogger(
      addPrefix(__filename, [SupportedNetwork.ERC721, tokenName])
    );
    const kind = ParseType(event.name);
    if (!kind) return [];
    try {
      const cwEvent = await Enrich(this._api, event.blockNumber, kind, event);
      cwEvent.chain = tokenName;
      return cwEvent ? [cwEvent] : [];
    } catch (e) {
      log.error(
        `Failed to enrich event. Block number: ${event.blockNumber}, Name/Kind: ${event.name}, Error Message: ${e.message}`
      );
      return [];
    }
  }
}
