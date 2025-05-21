import { logger } from '@hicommonwealth/core';
import { models } from '@hicommonwealth/model';
import { Connection } from '@solana/web3.js';

const log = logger(import.meta);

/**
 * Creates a Solana connection from a URL
 */
export function createSolanaConnection(url: string): Connection {
  return new Connection(url, 'confirmed');
}

/**
 * Get the chain node for a specific Solana network
 */
export async function getSolanaChainNode(network: string): Promise<any | null> {
  try {
    const chainNode = await models.ChainNode.findOne({
      where: {
        name: `Solana ${network}`,
      },
    });

    return chainNode;
  } catch (error) {
    log.error('Error fetching Solana chain node:', error, { network });
    return null;
  }
}

/**
 * Convert a slot range to a human-readable string for logging
 */
export function formatSlotRange(startSlot: number, endSlot: number): string {
  return `slots ${startSlot}-${endSlot}`;
}

/**
 * Get the maximum slot range to process at once based on configuration
 */
export function getMaxSlotRange(configuredMax: number | undefined): number {
  const defaultMax = 100;

  if (!configuredMax) {
    return defaultMax;
  }

  // Never allow more than 1000 slots at once to prevent timeouts
  return Math.min(configuredMax, 1000);
}
