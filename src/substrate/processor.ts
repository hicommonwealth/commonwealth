/**
 * Processes substrate blocks and emits events.
 */
import { ApiPromise } from '@polkadot/api';
import { Extrinsic, Event } from '@polkadot/types/interfaces';

import { IEventProcessor, CWEvent } from '../interfaces';
import { Block, isEvent, IEventData } from './types';
import { ParseType } from './filters/type_parser';
import { Enrich } from './filters/enricher';

import { factory, formatFilename } from '../logging';
const log = factory.getLogger(formatFilename(__filename));

export class Processor extends IEventProcessor<ApiPromise, Block> {
  private _lastBlockNumber: number;
  public get lastBlockNumber() { return this._lastBlockNumber; }

  /**
   * Parse events out of an substrate block and standardizes their format
   * for processing.
   *
   * @param block the block received for processing
   * @returns an array of processed events
   */
  public async process(block: Block): Promise<CWEvent<IEventData>[]> {
    // cache block number if needed for disconnection purposes
    const blockNumber = +block.header.number;
    if (!this._lastBlockNumber || blockNumber > this._lastBlockNumber) {
      this._lastBlockNumber = blockNumber;
    }

    const applyFilters = async (data: Event | Extrinsic) => {
      const kind = isEvent(data)
        ? ParseType(block.versionName, block.versionNumber, data.section, data.method)
        : ParseType(
          block.versionName,
          block.versionNumber,
          data.method.sectionName,
          data.method.methodName
        );
      if (kind !== null) {
        try {
          const result = await Enrich(this._api, blockNumber, kind, data);
          return result;
        } catch (e) {
          log.error(`Event enriching failed for ${kind}`);
          log.error(`Error: ${e}`);
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
