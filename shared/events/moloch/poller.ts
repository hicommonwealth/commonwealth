/**
 * Fetches historical events from Moloch contract.
 */
import { IEventPoller, IDisconnectedRange } from '../interfaces';

import { factory, formatFilename } from '../../../server/util/logging';
import { MolochApi } from '.';
import { MolochRawEvent } from './types';
const log = factory.getLogger(formatFilename(__filename));

export default class extends IEventPoller<MolochApi, MolochRawEvent> {
  /**
   * Connects to chain, fetches specified blocks and passes them
   * along for processing.
   *
   * @param startBlock first block to fetch
   * @param endBlock last block to fetch, omit to fetch to latest
   */
  public async poll(range: IDisconnectedRange): Promise<MolochRawEvent[]> {
    throw new Error('Polling not supported on Moloch.');
  }
}
