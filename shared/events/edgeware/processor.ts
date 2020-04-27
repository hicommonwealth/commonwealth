/**
 * Processes edgeware blocks and emits events.
 */
import { ApiPromise } from '@polkadot/api';

import { IBlockProcessor, CWEvent } from '../interfaces';
import { SubstrateBlock } from './types';
import parseEventType from './filters/type_parser';
import enrichEvent from './filters/enricher';

export default class extends IBlockProcessor<ApiPromise, SubstrateBlock> {
  private _lastBlockNumber: number;
  public get lastBlockNumber() { return this._lastBlockNumber; }

  /**
   * Parse events out of an edgeware block and standardizes their format
   * for processing.
   *
   * @param block the block received for processing
   * @returns an array of processed events
   */
  public async process(block: SubstrateBlock): Promise<CWEvent[]> {
    // cache block number if needed for disconnection purposes
    const blockNumber = +block.header.number;
    if (!this._lastBlockNumber || blockNumber > this._lastBlockNumber) {
      this._lastBlockNumber = blockNumber;
    }

    const events = await Promise.all(block.events.map(async ({ event }) => {
      // apply filters
      const kind = parseEventType(event, block.versionName, block.versionNumber);
      if (kind !== null) {
        try {
          const result = await enrichEvent(this._api, blockNumber, kind, event);
          return result;
        } catch (e) {
          console.error(`Event enriching failed for ${kind}`);
          return null;
        }
      } else {
        return null;
      }
    }));
    return events.filter((e) => !!e); // remove null / unwanted events
  }
}
