import BN from 'bn.js';
import { Coin } from '../../currency';

export class EthereumCoin extends Coin {
  constructor(denom: string, n: number | BN | EthereumCoin, inDollars: boolean = false) {
    super(denom, n, inDollars);
  }

  public toString() {
    return this.format();
  }
}

export class MolochShares extends EthereumCoin {
  constructor(n: number | BN | MolochShares) {
    super('Shares', n, false);
  }

  public toString() {
    return this.format();
  }
}
