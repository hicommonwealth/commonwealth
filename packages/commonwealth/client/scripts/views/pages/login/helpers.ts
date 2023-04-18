import type { LoginBodyType } from './types';

export const getLoginText = (bodyType: LoginBodyType) => {
  if (bodyType === 'walletList') {
    return {
      headerText: 'Connect Your Wallet',
      bodyText: `Many communities require different wallets 
      based on the chain they are built on and 
      the types of tokens members hold.`,
    };
  } else if (bodyType === 'selectAccountType') {
    return {
      headerText: 'New or Returning?',
      bodyText: 'Looks like this address hasn’t been connected before.',
    };
  } else if (bodyType === 'selectPrevious') {
    return {
      headerText: 'Select a Previously Linked Address',
      bodyText:
        'Manage your profiles, addresses and communities under one account.',
    };
  } else if (bodyType === 'welcome') {
    return {
      headerText: 'Welcome to Common!',
      bodyText:
        'Manage your profiles, addresses and communities under one account.',
    };
  } else if (bodyType === 'allSet') {
    return {
      headerText: `You're all set!`,
      bodyText: `By linking a new address, you are able to switch with ease \
        and manage all of your communities, addresses and profiles under one account.`,
    };
  } else if (bodyType === 'selectProfile') {
    return {
      headerText: `Select Profile`,
      bodyText: `By linking a new address, you are able to switch with ease  \
        and manage all of your communities, addresses and profiles under one account.`,
    };
  } else if (bodyType === 'connectWithEmail') {
    return {
      headerText: 'Connect with email?',
      bodyText: `Use Magic Link to connect with email and generate an address.`,
    };
  } else if (bodyType === 'ethWalletList') {
    return {
      headerText: 'Connect an ETH Wallet',
      bodyText:
        'An Ethereum based wallet is needed to connect to this community.',
    };
  } else if (bodyType === 'redirectToSign') {
    return {
      headerText: 'Redirect to wallet for signature',
      bodyText: 'Please wait while we redirect you to sign in.',
    };
  }
};
