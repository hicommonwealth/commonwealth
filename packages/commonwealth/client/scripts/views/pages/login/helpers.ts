import type { LoginActiveStep, LoginSidebarType } from './types';

export const getLoginText = (
  activeStep: LoginActiveStep,
  sidebarType: LoginSidebarType,
) => {
  if (activeStep === 'walletList' && sidebarType === 'createCommunityLogin') {
    return {
      headerText: 'Sign in to create your community',
      bodyText:
        'To launch your community choose a sign-in option that is compatible with the ecosystem you selected.',
    };
  } else if (activeStep === 'walletList') {
    return {
      headerText: 'Sign in to Commonwealth',
      bodyText: `Many communities require different wallets 
      based on the chain they are built on and 
      the types of tokens members hold.`,
    };
  } else if (activeStep === 'selectAccountType') {
    return {
      headerText: 'New or Returning?',
      bodyText: 'Looks like this address hasn’t been connected before.',
    };
  } else if (activeStep === 'selectPrevious') {
    return {
      headerText: 'Select a Previously Linked Address',
      bodyText:
        'Manage your profiles, addresses and communities under one account.',
    };
  } else if (activeStep === 'welcome') {
    return {
      headerText: 'Welcome to Common!',
      bodyText:
        'Manage your profiles, addresses and communities under one account.',
    };
  } else if (activeStep === 'allSet') {
    return {
      headerText: `You're all set!`,
      bodyText: `By linking a new address, you are able to switch with ease \
        and manage all of your communities, addresses and profiles under one account.`,
    };
  } else if (activeStep === 'selectProfile') {
    return {
      headerText: `Select Profile`,
      bodyText: `By linking a new address, you are able to switch with ease  \
        and manage all of your communities, addresses and profiles under one account.`,
    };
  } else if (activeStep === 'connectWithEmail') {
    return {
      headerText: 'Enter your email',
      bodyText: `Follow the instructions provided to sign in to Commonwealth with your email.`,
    };
  } else if (activeStep === 'ethWalletList') {
    return {
      headerText: 'Connect an ETH Wallet',
      bodyText:
        'An Ethereum based wallet is needed to connect to this community.',
    };
  } else if (activeStep === 'redirectToSign') {
    return {
      headerText: 'Redirect for Signature',
      bodyText: 'You must sign with your mobile wallet to continue.',
    };
  }
};
