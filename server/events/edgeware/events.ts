/**
 * Transforms raw edgeware events into the final form for storage
 */

import { IEventHandler } from '../interfaces';

export default class EdgewareEventHandler extends IEventHandler<any, any> {
  /**
   * Handles an event by transforming it as needed.
   * @param event the raw event from chain
   * @returns the processed event
   */
  public async handle(event) {
    return event;
  }
}
