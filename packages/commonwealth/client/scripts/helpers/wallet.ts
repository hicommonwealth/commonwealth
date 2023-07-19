import IWebWallet from '../models/IWebWallet';
import Near from '../controllers/chain/near/adapter';
import axios from 'axios';

const getAddressFromWallet = (wallet: IWebWallet<any>) => {
  const selectedAddress = (() => {
    if (wallet.chain === 'ethereum' || wallet.chain === 'solana') {
      return wallet.accounts[0];
    }

    if (wallet.defaultNetwork === 'terra') {
      return wallet.accounts[0].address;
    }

    if (wallet.chain === 'cosmos') {
      if (wallet.defaultNetwork === 'injective') {
        return wallet.accounts[0];
      }

      return wallet.accounts[0].address;
    }

    if (wallet.chain === 'substrate') {
      return wallet.accounts[0].address;
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
    console.log(error || 'Could not login');
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

export { getAddressFromWallet, loginToAxie, loginToNear };
