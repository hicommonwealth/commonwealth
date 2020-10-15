import BN from 'bn.js';

// duplicated in helpers.ts
export function formatNumberShort(num: number) {
  const round = (n, digits?) => {
    if (digits === undefined) digits = 2;
    return Math.round(n * Math.pow(10, digits)) / Math.pow(10, digits);
  };

  const precise = (n, digits?) => {
    if (digits === undefined) digits = 3;
    return n.toPrecision(digits)
  };

  // TODO: Clean this up
  return num > 1_000_000_000_000 ? round(num / 1_000_000_000_000) + 't' :
    num > 1_000_000_000 ? round(num / 1_000_000_000) + 'b' :
    num > 1_000_000 ? round(num / 1_000_000) + 'm' :
    num > 1_000 ? round(num / 1_000) + 'k' :
    num > 0.1 ? round(num) :
    num > 0.01 ? precise(num, 2) :
    num > 0.001 ? precise(num, 1) :
    num.toString();
}

const nf = new Intl.NumberFormat();

// duplicated in client/scripts/helpers.ts
function formatNumberLong(num : number) {
  // format small numbers with decimals, large numbers with commas
  if (num === 0) return '0';
  if (num < 0.000001) return num.toFixed(20).replace(/0*$/, '');
  if (num < 0.001) return num.toString();
  return nf.format(num);
}

export class Coin extends BN {
  public readonly dollar: BN; // commonly used base unit, e.g. 10^18 for ETH
  public readonly denom: string;

  constructor(denomination: string,
    n: number | BN,
    inDollars: boolean = false,
    dollar: BN = null,
  ) {
    // dollars are not set by default
    if (!dollar) dollar = new BN(1);

    if (typeof n === 'undefined' || n === null) {
      throw new Error('Invalid number');
    }
    if (typeof n === 'string') {
      throw new Error('Balance must be a BN or number');
    }

    let nBn: BN;
    if (typeof n === 'number') {
      try {
        // BN only accepts integers, so we have to use JavaScript math here
        nBn = inDollars
          ? dollar.muln(n)
          : new BN(`${n}`);
      } catch (e) {
        throw new Error(`Invalid balance: ${JSON.stringify(e)}`);
      }
    } else {
      nBn = n.clone();
    }

    // It would be ideal to actually return a BN, but there's a bug: https://github.com/indutny/bn.js/issues/206.
    super(nBn.toString());
    this.dollar = dollar;
    this.denom = denomination;
  }

  get inDollars(): number {
    return +this.div(this.dollar) + (+this.mod(this.dollar) / +this.dollar);
  }

  public format(short?: boolean): string {
    return `${short ? formatNumberShort(this.inDollars) : formatNumberLong(this.inDollars)} ${this.denom}`;
  }

  get asBN(): BN {
    return this.clone();
  }
}

// this exists to handle cases where a balance may be undefined
export function formatCoin(balance: Coin, short?: boolean): string {
  if (balance === undefined || balance === null) {
    return '--';
  } else {
    return balance.format(short);
  }
}
