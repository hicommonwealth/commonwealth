import BN from 'bn.js';
import { Coin } from 'adapters/currency';

export class NearToken extends Coin {
  constructor(n: number | string | BN, inDollars: boolean = false) {
    if (typeof n === 'string') {
      n = new BN(n, 10);
    }
    super('NEAR', n, inDollars, new BN(10).pow(new BN(24)));
  }
}
