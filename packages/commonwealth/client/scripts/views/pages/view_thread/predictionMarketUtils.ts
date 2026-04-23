/**
 * PASS/FAIL outcome token amounts (balances, swaps) use this fixed 1e18 scale.
 *
 * **Total minted / locked collateral from the indexer or vault logs** (`total_collateral`,
 * `getMarketCollateralBalanceFromLogs`) is stored in **protocol 1e18 fixed-point** (same scale
 * as mint event `collateral_amount` in tests), not necessarily the collateral ERC-20’s
 * `decimals()`.
 *
 * **`initial_liquidity` on a draft** is stored in **native ERC-20** smallest units (from
 * `convertInitialLiquidityToWei`). Use `collateralTokenDecimals` only for that field.
 *
 * Aggregates that mix collateral legs with swap notionals (e.g. `market_volume` SQL) are not
 * a single decimal scale; display uses 18 as an approximation where noted.
 */
export const PREDICTION_MARKET_LEDGER_DECIMALS = 18;

export function parseMarketAmountBigint(
  value?: string | bigint | null,
): bigint {
  try {
    if (typeof value === 'bigint') return value;
    return BigInt(value ?? '0');
  } catch {
    return 0n;
  }
}

/**
 * Human-readable “total minted” for PM UI: draft uses `initial_liquidity` + token decimals;
 * live markets use ledger totals + {@link PREDICTION_MARKET_LEDGER_DECIMALS}.
 */
export function predictionMarketTotalMintedDisplayNumber(
  status: string | undefined,
  ledgerTotalWei: string | bigint | null | undefined,
  initialLiquidity: string | null | undefined,
  collateralTokenDecimals: number,
): number {
  const draft = (status ?? '').toLowerCase() === 'draft';
  if (draft) {
    return weiToDisplayNumber(
      parseMarketAmountBigint(initialLiquidity),
      collateralTokenDecimals,
    );
  }
  return weiToDisplayNumber(
    parseMarketAmountBigint(ledgerTotalWei),
    PREDICTION_MARKET_LEDGER_DECIMALS,
  );
}

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
