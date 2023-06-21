import { Logger } from 'typescript-logging';
import { addPrefix, factory } from 'chain-events/src/logging';

export class LastCachedBlockNumber {
  private _lastCachedBlockNumber: number;
  private log: Logger;

  constructor(blockNumber?: number) {
    this._lastCachedBlockNumber = blockNumber;
    this.log = factory.getLogger(addPrefix(__filename));
  }

  public set(blockNumber: number) {
    if (blockNumber < this._lastCachedBlockNumber) {
      this.log.info(
        'Given block number is less than existing cached block number. The last cached' +
          'block number will not be updated.'
      );
    } else {
      this._lastCachedBlockNumber = blockNumber;
    }
  }

  public get() {
    return this._lastCachedBlockNumber;
  }
}
