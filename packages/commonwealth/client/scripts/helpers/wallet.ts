import IWebWallet from '../models/IWebWallet';
import Near from '../controllers/chain/near/adapter';
import axios from 'axios';
import { WalletId } from '../../../../common-common/src/types';

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
    [WalletId.NearWallet]: 'NEAR Wallet',
    [WalletId.TerraStation]: 'Terra Station',
    [WalletId.TerraWalletConnect]: 'Terra WalletConnect',
    [WalletId.CosmosEvmMetamask]: 'Metamask',
    [WalletId.Phantom]: 'Phantom',
    [WalletId.Ronin]: 'Ronin Wallet',
  };
  return lookups[walletId];
};

const getAddressFromWallet = (wallet: IWebWallet<any>) => {
  const selectedAddress = (() => {
    if (wallet.chain === 'ethereum' || wallet.chain === 'solana') {
      return wallet.accounts[0];
    }

    if (wallet.defaultNetwork === 'terra') {
      return wallet.accounts[0]?.address;
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

const loginToAxie = async (loginUrl = '') => {
  try {
    const response = await axios.post(loginUrl, {
      issuer: 'AxieInfinity',
    });

    const stateId = response.data.stateId;
    window.location.href = `https://app.axieinfinity.com/login/?src=commonwealth&stateId=${stateId}`;
  } catch (error) {
    console.log(error || 'Could not sign in');
  }
};

const loginToNear = async (activeChain: Near, isCustomDomain: boolean) => {
  const WalletAccount = (await import('near-api-js')).WalletAccount;
  if (!activeChain.apiInitialized) {
    await activeChain.initApi();
  }
  const nearWallet = new WalletAccount(
    (activeChain as Near).chain.api,
    'commonwealth_near'
  );
  if (nearWallet.isSignedIn()) {
    nearWallet.signOut();
  }

  const redirectUrl = !isCustomDomain
    ? `${window.location.origin}/${activeChain.id}/finishNearLogin`
    : `${window.location.origin}/finishNearLogin`;

  nearWallet.requestSignIn({
    contractId: (activeChain as Near).chain.isMainnet
      ? 'commonwealth-login.near'
      : 'commonwealth-login.testnet',
    successUrl: redirectUrl,
    failureUrl: redirectUrl,
  });
};

export { getWalletName, getAddressFromWallet, loginToAxie, loginToNear };
