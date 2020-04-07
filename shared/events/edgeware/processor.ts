/**
 * Processes edgeware blocks and emits events.
 */
import { IBlockProcessor } from '../interfaces';
import { SubstrateBlock, SubstrateEvent } from './types';
import { decodeSubstrateCodec, parseEventType } from './util';

export default class extends IBlockProcessor<SubstrateBlock, SubstrateEvent> {
  /**
   * Parse events out of an edgeware block and standardizes their format
   * for processing.
   *
   * @param block the block received for processing
   * @returns an array of processed events
   */
  public process(block: SubstrateBlock): SubstrateEvent[] {
    return block.events.map(({ event }) => {
      const type = parseEventType(event);
      if (type) {
        return { type, data: event.data.map((d) => decodeSubstrateCodec(d)) };
      } else {
        return null;
      }
    }).filter((e) => !!e); // remove null / unwanted events
  }
}
