/**
 * Processes substrate blocks and emits events.
 */
import { ApiPromise } from '@polkadot/api';
import { Extrinsic, Event } from '@polkadot/types/interfaces';

import { IEventProcessor, CWEvent } from '../../interfaces';
import { factory, formatFilename } from '../../logging';

import { Block, isEvent, IEventData } from './types';
import { ParseType } from './filters/type_parser';
import { Enrich, EnricherConfig } from './filters/enricher';

const log = factory.getLogger(formatFilename(__filename));

export class Processor extends IEventProcessor<ApiPromise, Block> {
  constructor(
    protected _api: ApiPromise,
    private _enricherConfig: EnricherConfig = {}
  ) {
    super(_api);
  }

  private _lastBlockNumber: number;

  public get lastBlockNumber(): number {
    return this._lastBlockNumber;
  }

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

    const applyFilters = async (
      data: Event | Extrinsic
    ): Promise<CWEvent<IEventData>> | null => {
      const kind = isEvent(data)
        ? ParseType(
            block.versionName,
            block.versionNumber,
            data.section,
            data.method
          )
        : ParseType(
            block.versionName,
            block.versionNumber,
            data.method.section,
            data.method.method
          );
      if (kind !== null) {
        try {
          const result = await Enrich(
            this._api,
            blockNumber,
            kind,
            data,
            this._enricherConfig
          );
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

    const events = await Promise.all(
      block.events.map(({ event }) => applyFilters(event))
    );

    // remove unsuccessful extrinsics, only keep extrinsics that map to ExtrinsicSuccess events
    // cf: https://polkadot.js.org/docs/api/cookbook/blocks#how-do-i-map-extrinsics-to-their-events
    const successfulExtrinsics = block.extrinsics.filter(
      (_extrinsic, index) => {
        const extrinsicEvents = block.events.filter(
          (event) =>
            event.phase &&
            event.phase.isApplyExtrinsic &&
            +event.phase.asApplyExtrinsic === index
        );
        // if the extrinsic involves any "success" events, then we keep it -- it may involve more than
        // that, though, as the result will list *all* events generated as a result of the extrinsic
        return (
          extrinsicEvents.findIndex(
            (e) => e.event.method === 'ExtrinsicSuccess'
          ) !== -1
        );
      }
    );
    const processedExtrinsics = await Promise.all(
      successfulExtrinsics.map((extrinsic) => applyFilters(extrinsic))
    );
    return [...events, ...processedExtrinsics].filter((e) => !!e); // remove null / unwanted events
  }
}
