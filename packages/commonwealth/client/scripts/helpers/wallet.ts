import { WalletId } from '@hicommonwealth/shared';
import IWebWallet from '../models/IWebWallet';

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

export { getAddressFromWallet };
