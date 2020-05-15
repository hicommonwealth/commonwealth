/**
 * Fetches events from a Moloch contract in real time.
 */
import { IBlockSubscriber } from '../interfaces';

export default class extends IBlockSubscriber<any, any> {
  /**
   * Initializes subscription to chain and starts emitting events.
   */
  public subscribe(cb: (block: any) => any) {
    return null;
  }

  public unsubscribe() {

  }
}
