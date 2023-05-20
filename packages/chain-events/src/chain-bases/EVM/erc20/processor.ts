/**
 * Processes ERC20 events.
 */
import type { CWEvent } from '../../../interfaces';
import { IEventProcessor, SupportedNetwork } from '../../../interfaces';
import { addPrefix, factory } from '../../../logging';

import { ParseType } from './filters/type_parser';
import type { EnricherConfig } from './filters/enricher';
import { Enrich } from './filters/enricher';
import type { IEventData, RawEvent, IErc20Contracts } from './types';

export class Processor extends IEventProcessor<IErc20Contracts, RawEvent> {
  constructor(
    protected _api: IErc20Contracts,
    private _enricherConfig: EnricherConfig = {}
  ) {
    super(_api);
  }

  /**
   * Parse events out of an ethereum block and standardizes their format
   * for processing.
   * @param event
   * @param origin
   * @returns an array of processed events
   */
  public async process(
    event: RawEvent,
    origin?: string
  ): Promise<CWEvent<IEventData>[]> {
    const log = factory.getLogger(
      addPrefix(__filename, [SupportedNetwork.ERC20, origin])
    );
    const kind = ParseType(event.event);
    if (!kind) return [];
    try {
      const cwEvent = await Enrich(
        this._api,
        event.blockNumber,
        kind,
        event,
        this._enricherConfig
      );
      cwEvent.chain = origin;
      return cwEvent ? [cwEvent] : [];
    } catch (e) {
      log.error(
        `Failed to enrich event. Block number: ${event.blockNumber}, Name/Kind: ${event.event}, Error Message: ${e.message}`
      );
      return [];
    }
  }
}
