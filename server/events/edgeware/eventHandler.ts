/**
 * Transforms raw edgeware events into the final form for storage
 */
import { IEventHandler } from '../interfaces';
import { SubstrateEvent } from './types';

export default class extends IEventHandler<SubstrateEvent> {
  /**
   * Handles an event by transforming it as needed.
   * @param event the raw event from chain
   * @returns the processed event
   */
  public async handle(event: SubstrateEvent) {
    // TODO
  }
}
