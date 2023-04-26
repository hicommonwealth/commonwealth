import { ChainBase } from 'common-common/src/types';

export function chainBaseToCanvasChain(
  chainBase: ChainBase,
  idOrPrefix: string | number
): string {
  // The canvas "chain" value is a CAIP-2 compliment chain id
  if (chainBase === ChainBase.CosmosSDK) {
    return `cosmos:${idOrPrefix.toString()}`;
  } else if (chainBase === ChainBase.Ethereum) {
    return `eip155:${idOrPrefix.toString()}`;
  } else if (chainBase === ChainBase.NEAR) {
    // Temporarily locked to mainnet
    // See also: client/scripts/views/pages/finish_near_login.tsx
    return `near:mainnet`
  } else if (chainBase === ChainBase.Solana) {
    // Temporarily locked to mainnet
    // See also: client/scripts/controllers/app/webWallets/phantom_web_wallet.ts
    return `solana:mainnet`
  } else if (chainBase === ChainBase.Substrate) {
    // Temporarily locked to generic Substrate chain id
    // See also: client/scripts/controllers/app/webWallets/polkadot_web_wallet.ts
    return `polkadot:42`
  }
}
