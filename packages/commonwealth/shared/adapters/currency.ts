import { calculateVoteWeight } from '@hicommonwealth/evm-protocols';
import { TopicWeightedVoting } from '@hicommonwealth/schemas';
import BN from 'bn.js';

// duplicated in helpers.ts
export function formatNumberShort(num: number) {
  const round = (n, digits?) => {
    if (digits === undefined) digits = 2;
    return Math.round(n * 10 ** digits) / 10 ** digits;
  };

  const precise = (n, digits?) => {
    if (digits === undefined) digits = 3;
    return n.toPrecision(digits);
  };

  // TODO: Clean this up
  return num > 1_000_000_000_000
    ? `${round(num / 1_000_000_000_000)}t`
    : num > 1_000_000_000
      ? `${round(num / 1_000_000_000)}b`
      : num > 1_000_000
        ? `${round(num / 1_000_000)}m`
        : num > 1_000
          ? `${round(num / 1_000)}k`
          : num > 0.1
            ? round(num)
            : num > 0.01
              ? precise(num, 2)
              : num > 0.001
                ? precise(num, 1)
                : num.toString();
}

export function formatBigNumberShort(num: number, numDecimals: number): string {
  if (num === 0) {
    return '0';
  }
  const thousand = 1_000;
  const million = 1_000_000;
  const billion = 1_000_000_000;
  const trillion = 1_000_000_000_000;

  const round = (n: number, divisor: number): string => {
    const divided = n / divisor;
    // remove unnecessary trailing zeros
    return divided.toFixed(numDecimals).replace(/\.?0+$/, '');
  };

  return num > trillion
    ? `${round(num, trillion)}t`
    : num > billion
      ? `${round(num, billion)}b`
      : num > million
        ? `${round(num, million)}m`
        : num > thousand
          ? `${round(num, thousand)}k`
          : num.toString();
}

/**
 * Converts a wei value to a human-readable vote weight string.
 *
 *  NOTE: if using a wei value from the backend, there's
 *        no need to set the multiplier because it's
 *        already weighted.
 *
 */
export const prettyVoteWeight = (
  wei: string,
  weightType?: TopicWeightedVoting | null | undefined,
  multiplier: number = 1,
  decimalsOverride?: number,
): string => {
  const weiStr = parseFloat(wei).toLocaleString('fullwide', {
    useGrouping: false,
  });
  const weiValue =
    weightType === TopicWeightedVoting.Stake
      ? parseInt(wei) * multiplier
      : calculateVoteWeight(weiStr, multiplier || 1);

  // for non-weighted and stake, just render as-is
  if (!weightType || weightType === TopicWeightedVoting.Stake) {
    return parseFloat((weiValue || 0).toString()).toString();
  }

  const n = Number(weiValue) / 1e18;
  if (n === 0) {
    return '0';
  }
  if (n < 0.000001) {
    return '0.0…';
  }

  let numDecimals = n > 10 ? 3 : 6;
  if (typeof decimalsOverride === 'number') {
    numDecimals = decimalsOverride;
  }
  if (n > 1000) {
    return formatBigNumberShort(n, numDecimals);
  }
  // remove trailing zeros after decimal
  return n.toFixed(numDecimals).replace(/\.?0+$/, '');
};

const nf = new Intl.NumberFormat();

// duplicated in client/scripts/helpers.ts
export function formatNumberLong(num: number) {
  // format small numbers with decimals, large numbers with commas
  if (num === 0) return '0';
  if (num < 0.000001) return num.toFixed(20).replace(/0*$/, '');
  if (num < 0.001) return num.toString();
  return nf.format(num);
}

export class Coin extends BN {
  public readonly dollar: BN; // commonly used base unit, e.g. 10^18 for ETH
  public readonly denom: string;

  constructor(
    denomination: string,
    n: number | BN,
    inDollars = false,
    // @ts-expect-error StrictNullChecks
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
        nBn = inDollars ? dollar.muln(n) : new BN(`${n}`);
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
    return +this.div(this.dollar) + +this.mod(this.dollar) / +this.dollar;
  }

  public format(short?: boolean): string {
    return `${
      short
        ? formatNumberShort(this.inDollars)
        : formatNumberLong(this.inDollars)
    } ${this.denom}`;
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
