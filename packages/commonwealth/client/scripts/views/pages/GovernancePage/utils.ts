/**
 * Converts a numeric or string token supply into a comma-separated format,
 * and appends token Symbol at the end.
 *
 * @param supply - The token supply (number or string).
 * @param tokenSymbol - The token Symbol to display.
 * @returns Formatted supply, e.g. "22,168,885,198 INCH"
 */
export function formatTokenSupply(
  supply: number | string,
  tokenSymbol: string,
): string {
  const parsedSupply = typeof supply === 'number' ? supply : parseFloat(supply);

  if (isNaN(parsedSupply)) {
    return '';
  }

  const formattedSupply = parsedSupply.toLocaleString();

  return `${formattedSupply} ${tokenSymbol}`;
}
