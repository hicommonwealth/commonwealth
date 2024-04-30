import { ChainBase } from '@hicommonwealth/shared';

export function chainBaseToCaip2(chainBase: ChainBase): string {
  // Translate Commonwealth ChainBase names to CAIP-2 Chain names.
  if (chainBase === ChainBase.CosmosSDK) {
    return 'cosmos';
  } else if (chainBase === ChainBase.Ethereum) {
    return 'eip155';
  } else if (chainBase === ChainBase.NEAR) {
    return 'near';
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
  } else if (prefix === 'near') {
    return ChainBase.NEAR;
  } else if (prefix === 'solana') {
    return ChainBase.Solana;
  } else if (prefix === 'polkadot') {
    return ChainBase.Substrate;
  } else {
    throw new Error(`Unknown CAIP-2 chain prefix: ${prefix}`);
  }
}

export function chainBaseToCanvasChainId(
  chainBase: ChainBase,
  idOrPrefix: string | number,
): string {
  // The Canvas chain id is a stringified ETH chain ID, or Cosmos bech32 prefix, or equivalent.
  if (chainBase === ChainBase.CosmosSDK) {
    // Temporarily locked to cosmoshub-1, since we don't have the live chain ID for cosmos chains
    return 'cosmoshub-1';
  } else if (chainBase === ChainBase.Ethereum) {
    return idOrPrefix ? idOrPrefix.toString() : '1';
  } else if (chainBase === ChainBase.NEAR) {
    // Temporarily locked to mainnet
    // See also: client/scripts/views/pages/finish_near_login.tsx
    return 'mainnet';
  } else if (chainBase === ChainBase.Solana) {
    // Temporarily locked to mainnet
    // 5ey... is the solana mainnet genesis hash
    // See also: client/scripts/controllers/app/webWallets/phantom_web_wallet.ts
    return '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp';
  } else if (chainBase === ChainBase.Substrate) {
    // Temporarily locked to generic Substrate chain id
    // See also: client/scripts/controllers/app/webWallets/polkadot_web_wallet.ts
    return '42';
  }
}
