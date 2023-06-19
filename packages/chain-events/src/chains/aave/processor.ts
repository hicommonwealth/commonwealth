/**
 * Processes Aave events.
 */
import type { CWEvent } from '../../interfaces';
import { IEventProcessor, SupportedNetwork } from '../../interfaces';
import { addPrefix, factory } from '../../logging';

import { Enrich } from './filters/enricher';
import type { IEventData, RawEvent, Api } from './types';
import { pascalToKebabCase } from 'chain-events/src/eth';

export class Processor extends IEventProcessor<Api, RawEvent> {
  constructor(protected readonly chain?: string) {
    super();
  }

  /**
   * Parse events out of an ethereum block and standardizes their format
   * for processing.
   *
   * @param event
   * @returns an array of processed events
   */
  public async process(event: RawEvent): Promise<CWEvent<IEventData>[]> {
    const log = factory.getLogger(
      addPrefix(__filename, [SupportedNetwork.Aave, this.chain])
    );
    const kind = pascalToKebabCase(event.name);
    if (!kind) return [];
    try {
      const cwEvent = await Enrich(event.blockNumber, kind, event);
      return [cwEvent];
    } catch (e) {
      log.error(
        `Failed to enrich event. Block number: ${event.blockNumber}, Name/Kind: ${event.name}, Error Message: ${e.message}`
      );
      return [];
    }
  }
}
