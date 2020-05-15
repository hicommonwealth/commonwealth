/**
 * Fetches historical events from Moloch contract.
 */
import { IBlockPoller, IDisconnectedRange } from '../interfaces';

import { factory, formatFilename } from '../../../server/util/logging';
const log = factory.getLogger(formatFilename(__filename));

export default class extends IBlockPoller<any, any> {
  /**
   * Connects to chain, fetches specified blocks and passes them
   * along for processing.
   *
   * @param startBlock first block to fetch
   * @param endBlock last block to fetch, omit to fetch to latest
   */
  public async poll(range: IDisconnectedRange): Promise<any[]> {
    return null;
  }
}
