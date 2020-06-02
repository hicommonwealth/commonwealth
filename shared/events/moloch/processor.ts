/**
 * Processes Moloch events.
 */
import { IEventProcessor, CWEvent } from '../interfaces';
import parseEventType from './filters/type_parser';
import enrichEvent from './filters/enricher';

import { factory, formatFilename } from '../../logging';
import { IMolochEventData, MolochRawEvent } from './types';
import { MolochApi } from '.';
const log = factory.getLogger(formatFilename(__filename));

export default class extends IEventProcessor<MolochApi, MolochRawEvent> {
  /**
   * Parse events out of an edgeware block and standardizes their format
   * for processing.
   *
   * @param block the block received for processing
   * @returns an array of processed events
   */
  public async process(event: MolochRawEvent): Promise<CWEvent<IMolochEventData>[]> {
    return [];
  }
}
