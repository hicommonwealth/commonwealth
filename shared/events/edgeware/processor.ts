/**
 * Processes edgeware blocks and emits events.
 */
import { ApiPromise } from '@polkadot/api';
import { GenericEvent } from '@polkadot/types';
import { Extrinsic, Event } from '@polkadot/types/interfaces';

import { IBlockProcessor, CWEvent } from '../interfaces';
import { SubstrateBlock, isEvent } from './types';
import parseEventType from './filters/type_parser';
import enrichEvent from './filters/enricher';

import { factory, formatFilename } from '../../../server/util/logging';
const log = factory.getLogger(formatFilename(__filename));

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

    const applyFilters = async (data: Event | Extrinsic) => {
      const kind = isEvent(data)
        ? parseEventType(block.versionName, block.versionNumber, data.section, data.method)
        : parseEventType(
          block.versionName,
          block.versionNumber,
          data.method.sectionName,
          data.method.methodName
        );
      if (kind !== null) {
        try {
          const result = await enrichEvent(this._api, blockNumber, kind, data);
          return result;
        } catch (e) {
          log.error(`Event enriching failed for ${kind}`);
          return null;
        }
      } else {
        return null;
      }
    };

    const events = await Promise.all(block.events.map(({ event }) => applyFilters(event)));
    const extrinsics = await Promise.all(block.extrinsics.map((extrinsic) => applyFilters(extrinsic)));
    return [...events, ...extrinsics].filter((e) => !!e); // remove null / unwanted events
  }
}
