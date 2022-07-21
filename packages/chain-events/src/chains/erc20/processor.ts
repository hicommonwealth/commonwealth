/**
 * Processes ERC20 events.
 */
import { IEventProcessor, CWEvent, SupportedNetwork } from '../../interfaces';
import { addPrefix, factory } from '../../logging';

import { ParseType } from './filters/type_parser';
import { Enrich, EnricherConfig } from './filters/enricher';
import { IEventData, RawEvent, IErc20Contracts } from './types';

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
   * @param tokenName
   * @returns an array of processed events
   */
  public async process(
    event: RawEvent,
    tokenName?: string
  ): Promise<CWEvent<IEventData>[]> {
    const log = factory.getLogger(
      addPrefix(__filename, [SupportedNetwork.ERC20, tokenName])
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
      cwEvent.chain = tokenName;
      return cwEvent ? [cwEvent] : [];
    } catch (e) {
      log.error(
        `Failed to enrich event. Block number: ${event.blockNumber}, Name/Kind: ${event.event}, Error Message: ${e.message}`
      );
      return [];
    }
  }
}
