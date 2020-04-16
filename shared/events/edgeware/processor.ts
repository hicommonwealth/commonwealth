/**
 * Processes edgeware blocks and emits events.
 */
import { IBlockProcessor } from '../interfaces';
import { SubstrateBlock, SubstrateEvent, SubstrateEventType } from './types';
import { decodeSubstrateCodec } from './util';
import { parseEventType } from './filters/type_parser';

export default class extends IBlockProcessor<SubstrateBlock, SubstrateEvent> {
  private _lastBlockNumber: number;
  public get lastBlockNumber() { return this._lastBlockNumber; }

  /**
   * Parse events out of an edgeware block and standardizes their format
   * for processing.
   *
   * @param block the block received for processing
   * @returns an array of processed events
   */
  public process(block: SubstrateBlock): SubstrateEvent[] {
    // cache block number if needed for disconnection purposes
    const blockNumber = +block.header.number;
    if (!this._lastBlockNumber || blockNumber > this._lastBlockNumber) {
      this._lastBlockNumber = blockNumber;
    }

    // pass along events
    return block.events.map(({ event }) => {
      const type = parseEventType(event);
      if (type !== SubstrateEventType.Unknown) {
        console.log(JSON.stringify(event.meta));
        console.log(JSON.stringify(event.typeDef));
        return {
          type,
          blockNumber,
          name: `${event.section}.${event.method}`,
          documentation: event.meta.documentation.length > 0 ? event.meta.documentation.join(' ') : '',
          typedefs: event.meta.args.map((t) => t.toString()),
          data: event.data.map((d) => decodeSubstrateCodec(d))
        };
      } else {
        return null;
      }
    }).filter((e) => !!e); // remove null / unwanted events
  }
}
