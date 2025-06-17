/**
 * Gets the Solana cluster name from a URL or defaults to mainnet-beta
 * @param url The Solana RPC URL
 * @returns The cluster name (mainnet-beta, devnet, testnet, or custom)
 */
export const getSolanaClusterFromUrl = (url: string): string => {
  if (!url) return 'mainnet-beta';

  const lowercasedUrl = url.toLowerCase();

  if (lowercasedUrl.includes('mainnet') || lowercasedUrl === 'mainnet-beta') {
    return 'mainnet-beta';
  } else if (lowercasedUrl.includes('devnet') || lowercasedUrl === 'devnet') {
    return 'devnet';
  } else if (lowercasedUrl.includes('testnet') || lowercasedUrl === 'testnet') {
    return 'testnet';
  }

  // Default to mainnet-beta for any other URL
  return 'mainnet-beta';
};

/**
 * Builds a Solana Explorer link for a transaction
 * @param txHash The transaction hash
 * @param clusterUrl The Solana RPC URL to determine the cluster
 * @returns The Solana Explorer URL
 */
export const buildSolanaExplorerLink = (
  txHash: string,
  clusterUrl: string,
): string => {
  const cluster = getSolanaClusterFromUrl(clusterUrl);

  // Only append cluster parameter if it's not mainnet-beta
  const clusterParam = cluster !== 'mainnet-beta' ? `?cluster=${cluster}` : '';

  return `https://explorer.solana.com/tx/${txHash}${clusterParam}`;
};
