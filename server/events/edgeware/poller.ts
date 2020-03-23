/**
 * Fetches historical events from edgeware chain.
 */

import EdgewareBlockProcessor from './processor';
import { IBlockPoller } from '../interfaces';

export default class EdgewareBlockPoller extends IBlockPoller<any, any, any> {
  constructor(
    protected _blockProcessor: EdgewareBlockProcessor,
    protected _connectionOptions,
  ) {
    super(_blockProcessor, _connectionOptions);
  }

  /**
   * Connects to chain, fetches specified blocks and passes them
   * along for processing.
   *
   * @param startBlock first block to fetch
   * @param endBlock last block to fetch, omit to fetch to latest
   */
  public async poll(startBlock, endBlock?) {
    // TODO
  }
}
