/**
 * Futarchy contract addresses per chain. Used by deployPredictionMarketOnChain.
 * Set VITE_FUTARCHY_GOVERNOR_ADDRESSES in env to a JSON object, e.g. {"84532":"0x..."}.
 */
/** Static map for known governor addresses when env is not used. */
const GOVERNOR_BY_CHAIN: Partial<Record<number, string>> = {
  // Add addresses when contracts are deployed, e.g.:
  // 84532: '0x...', // Base Sepolia
  // 8453: '0x...',  // Base
};

function fromEnv(ethChainId: number): string | null {
  const raw =
    typeof process.env.VITE_FUTARCHY_GOVERNOR_ADDRESSES === 'string'
      ? process.env.VITE_FUTARCHY_GOVERNOR_ADDRESSES.trim()
      : '';
  if (!raw) return null;
  try {
    const map = JSON.parse(raw) as Record<string, string>;
    const v = map[String(ethChainId)];
    return v && typeof v === 'string' && v.startsWith('0x') ? v : null;
  } catch {
    return null;
  }
}

/**
 * Returns the FutarchyGovernor contract address for the given chain, or null if not configured.
 */
export function getFutarchyGovernorAddress(ethChainId: number): string | null {
  return fromEnv(ethChainId) ?? GOVERNOR_BY_CHAIN[ethChainId] ?? null;
}

export function isFutarchyDeployConfigured(ethChainId: number): boolean {
  return getFutarchyGovernorAddress(ethChainId) != null;
}
