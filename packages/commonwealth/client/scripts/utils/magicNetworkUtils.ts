import { Magic } from 'magic-sdk';
import NodeInfo from 'models/NodeInfo';
import { fetchCachedPublicEnvVar } from 'state/api/configuration';
import { fetchCachedNodes } from 'state/api/nodes';
import { userStore } from 'state/ui/user';

// Cache Magic instances to avoid recreating them
const magicInstancesCache: Record<number, Magic> = {};

/**
 * Creates or returns a cached Magic instance for a specific network
 */
export const getMagicInstanceForChain = (
  chainId: number,
  rpcUrl: string,
): Magic | null => {
  const { MAGIC_PUBLISHABLE_KEY } = fetchCachedPublicEnvVar() || {};

  try {
    if (!MAGIC_PUBLISHABLE_KEY) {
      return null;
    }

    // Return cached instance if available
    if (magicInstancesCache[chainId]) {
      return magicInstancesCache[chainId];
    }

    // Create new instance for this chain
    const magic = new Magic(MAGIC_PUBLISHABLE_KEY, {
      network: {
        rpcUrl,
        chainId,
      },
    });

    // Cache for future use
    magicInstancesCache[chainId] = magic;
    return magic;
  } catch (error) {
    return null;
  }
};

/**
 * Gets Magic instance for a known chain using cached nodes
 */
export const getMagicForChain = (chainId: number): Magic | null => {
  const nodes = fetchCachedNodes();
  if (!nodes) {
    return null;
  }

  const chainNode = nodes.find((n) => n.ethChainId === chainId) as NodeInfo;
  if (!chainNode) {
    return null;
  }

  // Use the first URL if multiple are provided
  const urls = chainNode.url.split(',').map((url) => url.trim());
  const primaryUrl = urls[0];

  return getMagicInstanceForChain(chainId, primaryUrl);
};

/**
 * Checks if user is authenticated with Magic
 */
export const isMagicUser = (): boolean => {
  try {
    // Get the user state from the userStore instead of window.userStore
    const { isLoggedIn, addresses } = userStore.getState();

    return (
      isLoggedIn &&
      addresses.some((addr) => addr.walletId?.toLowerCase().includes('magic'))
    );
  } catch (error) {
    return false;
  }
};
