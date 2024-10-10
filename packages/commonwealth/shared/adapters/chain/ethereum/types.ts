import BN from 'bn.js';
import { Coin } from '../../currency';

export class EthereumCoin extends Coin {
  constructor(denom: string, n: number | BN | EthereumCoin, inDollars = false) {
    super(denom, n, inDollars, new BN(10).pow(new BN(18)));
  }
}
