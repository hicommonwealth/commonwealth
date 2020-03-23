/**
 * Fetches events from edgeware chain in real time.
 */
import EdgewareBlockProcessor from './processor';
import { IBlockSubscriber } from '../interfaces';

export default class EdgewareBlockSubscriber extends IBlockSubscriber<any, any, any> {
  constructor(
    protected _blockProcessor: EdgewareBlockProcessor,
    protected _connectionOptions,
  ) {
    super(_blockProcessor, _connectionOptions);
  }

  /**
   * Initializes subscription to chain and starts emitting events.
   */
  public async connect() {
    // TODO
  }

  /**
   * Halts emission of chain events.
   */
  public disconnect() {
    // TODO
  }
}
