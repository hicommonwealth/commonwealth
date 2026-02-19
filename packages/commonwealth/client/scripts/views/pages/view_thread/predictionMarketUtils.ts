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
