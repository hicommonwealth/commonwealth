import { WalletId } from '@hicommonwealth/shared';
import IWebWallet from '../models/IWebWallet';

// getWalletName() fetches friendly names for wallets. It is assumed
// that the user already knows what chain or community they are
// logging into, so a more concise wallet name can be used,
// e.g. "Keplr" instead of "Keplr (Ethereum)".
//
// Do not enumerate over this list for logins across multiple chains -
// there will be multiple entries with the same names.
//
// Examples:
// - Please login via {Metamask}.
// - Please login via {WalletConnect}.
// - Please reconnect your wallet via {Metamask}.
// - Please reconnect your wallet via {WalletConnect}.
// - Please select a login method: {Magic Link}, {Metamask}, {WalletConnect}...

const getWalletName = (walletId: WalletId) => {
  const lookups = {
    [WalletId.Magic]: 'Magic Link',
    [WalletId.Polkadot]: 'Polkadot',
    [WalletId.Metamask]: 'Metamask',
    [WalletId.WalletConnect]: 'WalletConnect',
    [WalletId.KeplrEthereum]: 'Keplr',
    [WalletId.Keplr]: 'Keplr',
    [WalletId.Leap]: 'Leap',
    [WalletId.TerraStation]: 'Terra Station',
    [WalletId.TerraWalletConnect]: 'Terra WalletConnect',
    [WalletId.CosmosEvmMetamask]: 'Metamask',
    [WalletId.Phantom]: 'Phantom',
  };
  return lookups[walletId];
};

const getAddressFromWallet = (wallet: IWebWallet<any>) => {
  const selectedAddress = (() => {
    if (wallet.chain === 'ethereum' || wallet.chain === 'solana') {
      return wallet.accounts[0];
    }

    if (wallet.defaultNetwork === 'terra') {
      if (wallet.name === WalletId.TerraWalletConnect) {
        return wallet.accounts[0]?.address;
      } else {
        return wallet.accounts[0];
      }
    }

    if (wallet.chain === 'cosmos') {
      if (wallet.defaultNetwork === 'injective') {
        return wallet.accounts[0];
      }

      return wallet.accounts[0]?.address;
    }

    if (wallet.chain === 'substrate') {
      return wallet.accounts[0]?.address;
    }
  })();

  return selectedAddress;
};

export { getAddressFromWallet, getWalletName };
