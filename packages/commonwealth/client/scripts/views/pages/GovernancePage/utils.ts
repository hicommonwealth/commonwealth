/**
 * Converts a numeric or string token supply into a comma-separated format,
 * and appends "INCH" at the end.
 *
 * @param supply - The token supply (number or string).
 * @param ticker - The token ticker to display (defaults to "INCH").
 * @returns Formatted supply, e.g. "22,168,885,198 INCH"
 */
export function formatTokenSupply(
  supply: number | string,
  ticker: string = 'INCH',
): string {
  const parsedSupply = typeof supply === 'number' ? supply : parseFloat(supply);

  if (isNaN(parsedSupply)) {
    return '';
  }

  const formattedSupply = parsedSupply.toLocaleString();

  return `${formattedSupply} ${ticker}`;
}
