import { ChainBase } from '@hicommonwealth/shared';

export const COSMOS_CHAIN_ID = 'cosmoshub-1';
export const SOLANA_MAINNET_CHAIN_ID = '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp';
export const SUBSTRATE_CHAIN_ID = '42';

export function chainBaseToCaip2(chainBase: ChainBase): string {
  // Translate Commonwealth ChainBase names to CAIP-2 Chain names.
  if (chainBase === ChainBase.CosmosSDK) {
    return 'cosmos';
  } else if (chainBase === ChainBase.Ethereum) {
    return 'eip155';
  } else if (chainBase === ChainBase.Solana) {
    return 'solana';
  } else if (chainBase === ChainBase.Substrate) {
    return 'polkadot';
  } else {
    throw new Error(`Unknown chainBase: ${chainBase}`);
  }
}

export function caip2ToChainBase(caip2: string): ChainBase {
  const prefix = caip2.split(':')[0];
  if (prefix === 'eip155') {
    return ChainBase.Ethereum;
  } else if (prefix === 'cosmos') {
    return ChainBase.CosmosSDK;
  } else if (prefix === 'solana') {
    return ChainBase.Solana;
  } else if (prefix === 'polkadot') {
    return ChainBase.Substrate;
  } else {
    throw new Error(`Unknown CAIP-2 chain prefix: ${prefix}`);
  }
}

/**
 * Convert ChainBase to a Canvas chain id, which is a stringified
 * ETH chain ID, or Cosmos bech32 prefix, or equivalent.
 */
export function chainBaseToCanvasChainId(
  chainBase: ChainBase,
  idOrPrefix: string | number,
  // @ts-expect-error StrictNullChecks
): string {
  if (chainBase === ChainBase.Ethereum) {
    return idOrPrefix ? idOrPrefix.toString() : '1';
  } else if (chainBase === ChainBase.CosmosSDK) {
    return COSMOS_CHAIN_ID;
  } else if (chainBase === ChainBase.Solana) {
    return SOLANA_MAINNET_CHAIN_ID;
  } else if (chainBase === ChainBase.Substrate) {
    return SUBSTRATE_CHAIN_ID;
  }
}
