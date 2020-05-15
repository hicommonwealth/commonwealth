/**
 * Processes Moloch events.
 */
import { IBlockProcessor, CWEvent } from '../interfaces';
import parseEventType from './filters/type_parser';
import enrichEvent from './filters/enricher';

import { factory, formatFilename } from '../../../server/util/logging';
import { IMolochEventData } from './types';
const log = factory.getLogger(formatFilename(__filename));

export default class extends IBlockProcessor<any, any> {
  /**
   * Parse events out of an edgeware block and standardizes their format
   * for processing.
   *
   * @param block the block received for processing
   * @returns an array of processed events
   */
  public async process(block: any): Promise<CWEvent<IMolochEventData>[]> {
    return null;
  }
}
