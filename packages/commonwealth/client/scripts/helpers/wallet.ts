import IWebWallet from '../models/IWebWallet';
import Near from '../controllers/chain/near/adapter';

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
  })();

  return selectedAddress;
};

const loginToAxie = async (loginUrl = '') => {
  const result = await $.post(loginUrl, {
    issuer: 'AxieInfinity',
  });

  if (result.status === 'Success' && result.result.stateId) {
    const stateId = result.result.stateId;

    // redirect to axie page for login
    // eslint-disable-next-line max-len
    window.location.href = `https://app.axieinfinity.com/login/?src=commonwealth&stateId=${stateId}`;
  } else {
    console.log(result.error || 'Could not login');
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
