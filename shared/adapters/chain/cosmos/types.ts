import BN from 'bn.js';
import { Coin } from 'adapters/currency';

export class CosmosToken extends Coin {
  constructor(denom: string, n: number | string | BN, inDollars: boolean = false) {
    if (typeof n === 'string') {
      n = parseInt(n, 10);
    }
    if (inDollars) {
      throw new Error('cannot create cosmos token in dollars!');
    }
    super(denom, n, inDollars);
  }

  get inDollars(): number {
    return +this;
  }

  public toCoinObject() {
    return { amount: this.toNumber(), denom: this.denom };
  }
}
