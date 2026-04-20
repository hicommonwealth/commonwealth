/**
 * Integers from prediction-market totals, indexer trades, and PASS/FAIL ERC20
 * balances in this app are treated as this fixed scale (WAD / outcome-token scale).
 * Collateral amounts typed by the user for mint still use the ERC-20's decimals.
 */
export const PREDICTION_MARKET_LEDGER_DECIMALS = 18;

/**
 * Format collateral amount from wei/smallest unit to human-readable string.
 * Assumes 18 decimals. Returns e.g. "1.50K", "2.00M", or "0.00" on error.
 */
export function formatCollateral(amount: string): string {
  try {
    const value = BigInt(amount);
    const divisor = BigInt(10 ** 18);
    const formatted = Number(value / divisor);

    if (formatted >= 1000000) {
      return `${(formatted / 1000000).toFixed(2)}M`;
    }
    if (formatted >= 1000) {
      return `${(formatted / 1000).toFixed(2)}K`;
    }
    return formatted.toFixed(2);
  } catch {
    return '0.00';
  }
}

export function weiToDisplayNumber(
  value: string | bigint | null | undefined,
  decimals = 18,
): number {
  try {
    const wei = typeof value === 'bigint' ? value : BigInt(value ?? '0');
    if (wei <= 0n) return 0;
    const safeDecimals = Math.max(0, decimals);
    const raw = wei.toString();
    if (safeDecimals === 0) return Number(raw);
    const padded = raw.padStart(safeDecimals + 1, '0');
    const whole = padded.slice(0, -safeDecimals);
    const frac = padded.slice(-safeDecimals).replace(/0+$/, '');
    const composed = frac ? `${whole}.${frac}` : whole;
    return Number(composed);
  } catch {
    return 0;
  }
}

export function sumWeiValues(
  ...values: Array<string | bigint | null | undefined>
): bigint {
  return values.reduce<bigint>((acc, value) => {
    try {
      const wei = typeof value === 'bigint' ? value : BigInt(value ?? '0');
      return acc + wei;
    } catch {
      return acc;
    }
  }, 0n);
}
