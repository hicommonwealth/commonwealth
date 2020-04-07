/**
 * Processes edgeware blocks and emits events.
 */
import { IBlockProcessor } from '../interfaces';
import { SubstrateBlock, SubstrateEvent, SubstrateEventType } from './types';
import { decodeSubstrateType } from './util';

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
      switch (event.section) {
        case 'staking':
          switch (event.method) {
            case 'slashing': return {
              type: SubstrateEventType.Slashing,
              data: event.data.map((d) => decodeSubstrateType(d)),
            };
            default:
              return null;
          }
        default:
          return null;
      }
    })
    // remove null / unwanted events
      .filter((e) => !!e);
  }
}
