import { WalletId } from '@hicommonwealth/shared';
import IWebWallet from 'models/IWebWallet';

const getAccountAddress = (
  account: { address: string } | string | undefined,
) => {
  if (typeof account === 'string') {
    return account;
  }
  return account?.address;
};

const getAddressFromWallet = (
  wallet: IWebWallet<{ address: string } | string>,
) => {
  const firstAccount = wallet.accounts[0];
  const selectedAddress = (() => {
    if (wallet.chain === 'ethereum' || wallet.chain === 'solana') {
      return getAccountAddress(firstAccount);
    }

    if (wallet.defaultNetwork === 'terra') {
      if (wallet.name === WalletId.TerraWalletConnect) {
        return getAccountAddress(firstAccount);
      } else {
        return getAccountAddress(firstAccount);
      }
    }

    if (wallet.chain === 'cosmos') {
      if (wallet.defaultNetwork === 'injective') {
        return getAccountAddress(firstAccount);
      }

      return getAccountAddress(firstAccount);
    }

    if (wallet.chain === 'substrate') {
      return getAccountAddress(firstAccount);
    }

    if (wallet.chain === 'sui') {
      return getAccountAddress(firstAccount);
    }
  })();

  return selectedAddress;
};

export { getAddressFromWallet };
