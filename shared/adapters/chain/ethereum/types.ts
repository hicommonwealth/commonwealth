import BN from 'bn.js';
import { Coin } from '../../currency';

export class EthereumCoin extends Coin {
  constructor(denom: string, n: number | BN | EthereumCoin, inDollars: boolean = false) {
    super('ETH', n, inDollars);
  }

  public toString() {
    return this.format();
  }
}
