/**
 * Processes edgeware blocks and emits events.
 */

import EdgewareEventHandler from './events';
import { IBlockProcessor } from '../interfaces';

export default class EdgewareBlockProcessor extends IBlockProcessor<any, any, any> {
  constructor(
    protected _eventHandler: EdgewareEventHandler,
  ) {
    super(_eventHandler);
  }

  /**
   * Parse events out of an edgeware block and submits them to
   * the corresponding event handler.
   *
   * @param block the block received for processing
   * @returns an array of processed events
   */
  public process(block) {
    // TODO
    return [];
  }
}
