/**
 * Processes substrate blocks and emits events.
 */
import type { ApiPromise } from '@polkadot/api';
import type { Extrinsic, Event } from '@polkadot/types/interfaces';

import type { CWEvent } from '../../interfaces';
import { IEventProcessor, SupportedNetwork } from '../../interfaces';
import { addPrefix, factory } from '../../logging';

import type { Block, IEventData } from './types';
import { isEvent } from './types';
import { ParseType } from './filters/type_parser';
import type { EnricherConfig } from './filters/enricher';
import { Enrich } from './filters/enricher';

export class Processor extends IEventProcessor<ApiPromise, Block> {
  constructor(
    protected _api: ApiPromise,
    private _enricherConfig: EnricherConfig = {},
    protected readonly origin?: string
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
    const log = factory.getLogger(
      addPrefix(__filename, [
        SupportedNetwork.Substrate,
        this.origin || block.versionName,
      ])
    );

    // cache block number if needed for disconnection purposes
    const blockNumber = +block.header.number;
    if (!this._lastBlockNumber || blockNumber > this._lastBlockNumber) {
      this._lastBlockNumber = blockNumber;
    }

    const applyFilters = async (
      data: Event | Extrinsic
    ): Promise<CWEvent<IEventData>> | null => {
      const section = isEvent(data) ? data.section : data.method.section;
      const method = isEvent(data) ? data.method : data.method.method;
      const kind = ParseType(
        block.versionName,
        block.versionNumber,
        section,
        method
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
          log.error(
            `Failed to enrich event. Block number: ${blockNumber}, Chain/Version Name: ${block.versionName}, Version Number: ${block.versionNumber}, Section: ${section}, Method: ${method}, Error Message: ${e.message}`
          );
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
