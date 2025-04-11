import { ChainBase, WalletId } from '@hicommonwealth/shared';
import type AddressInfo from '../models/AddressInfo';
import { CustomIconName } from '../views/components/component_kit/cw_icons/cw_icon_lookup';

interface AddressInfoLike {
  address: string;
  walletId?: WalletId;
  wallet_id?: WalletId;
  community?: {
    id: string;
  };
}

/**
 * Determines the appropriate chain icon based on wallet type and community base
 * @param address AddressInfo or similar object containing walletId and other details
 * @param communityBase Optional ChainBase if known
 * @returns CustomIconName for the chain icon
 */
export const getChainIcon = (
  address: AddressInfo | AddressInfoLike,
  communityBase?: ChainBase,
): CustomIconName => {
  // First check wallet type if available
  const walletId = 'walletId' in address ? address.walletId : address.wallet_id;

  if (walletId) {
    if (
      [WalletId.Phantom, WalletId.Solflare, WalletId.Backpack].includes(
        walletId,
      )
    ) {
      return 'solana';
    }
    if (walletId === WalletId.Keplr) {
      return 'cosmos';
    }
  }

  // If no specific wallet match, check community base
  if (communityBase) {
    switch (communityBase) {
      case ChainBase.Solana:
        return 'solana';
      case ChainBase.CosmosSDK:
        return 'cosmos';
      case ChainBase.NEAR:
        return 'nearIcon';
      case ChainBase.Substrate:
        return 'polkadot';
      case ChainBase.Ethereum:
      default:
        return 'eth';
    }
  }

  return 'eth'; // default fallback
};
