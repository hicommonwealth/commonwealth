import BN from 'bn.js';
import { Coin, formatNumberShort, formatNumberLong } from 'adapters/currency';

export class NearToken extends Coin {
  constructor(
    n: number | string | BN,
    inDollars = false,
    dollar: BN = null,
  ) {
    if (typeof n === 'string') {
      n = new BN(n, 10);
    }
    super('NEAR', n, inDollars, dollar);
  }

  public format(short?: boolean) {
    return `Ⓝ${short ? formatNumberShort(this.inDollars) : formatNumberLong(this.inDollars)}`;
  }
}
