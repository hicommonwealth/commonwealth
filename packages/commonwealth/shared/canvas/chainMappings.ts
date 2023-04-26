import { ChainBase } from 'common-common/src/types';

export function chainBaseToCanvasChainId(
  chainBase: ChainBase,
  idOrPrefix: string | number
): string {
  // The Canvas chain id is a stringified ETH chain ID, or Cosmos bech32 prefix, or equivalent.
  if (chainBase === ChainBase.CosmosSDK) {
    return idOrPrefix.toString();
  } else if (chainBase === ChainBase.Ethereum) {
    return idOrPrefix.toString();
  } else if (chainBase === ChainBase.NEAR) {
    // Temporarily locked to mainnet
    // See also: client/scripts/views/pages/finish_near_login.tsx
    return 'mainnet';
  } else if (chainBase === ChainBase.Solana) {
    // Temporarily locked to mainnet
    // See also: client/scripts/controllers/app/webWallets/phantom_web_wallet.ts
    return 'mainnet';
  } else if (chainBase === ChainBase.Substrate) {
    // Temporarily locked to generic Substrate chain id
    // See also: client/scripts/controllers/app/webWallets/polkadot_web_wallet.ts
    return '42';
  }
}
