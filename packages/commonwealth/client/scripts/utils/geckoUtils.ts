/**
 * Converts a boolean value to a query parameter value.
 * @param value - The boolean to convert.
 * @returns '1' if true, '0' if false.
 */
export const boolToQueryValue = (value: boolean): string => (value ? '1' : '0');

/**
 * Constructs the base URL for GeckoTerminal.
 * @param chain - The blockchain network.
 * @param poolAddress - The pool address.
 * @returns The base URL string.
 */
export const getBaseUrl = (chain: string, poolAddress: string): string =>
  `https://www.geckoterminal.com/${chain}/pools/${poolAddress}`;
