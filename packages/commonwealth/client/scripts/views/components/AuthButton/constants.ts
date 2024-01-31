import { AuthTypesList } from './types';

// A list of all the available auth types, with config for rendering the button
export const AUTH_TYPES: AuthTypesList = {
  // general
  walletConnect: {
    icon: {
      name: 'walletconnect',
      isCustom: true,
    },
    label: 'WalletConnect',
    description: {
      text: 'Supports 350+ Wallets',
      hasBackground: true,
    },
  },
  // browser wallets
  NO_WALLETS_FOUND: {
    // For cases when there is no wallet found
    icon: {
      name: 'warning',
      isCustom: false,
    },
    label: 'No wallets found',
  },
  keplr: {
    icon: {
      name: 'keplr',
      isCustom: true,
    },
    label: 'Keplr',
    description: {
      text: 'Cosmos Communities',
      hasBackground: false,
    },
  },
  leap: {
    icon: {
      name: 'leap',
      isCustom: true,
    },
    label: 'Leap',
    description: {
      text: 'Cosmos Communities',
      hasBackground: false,
    },
  },
  // SSO's
  google: {
    icon: {
      name: 'google',
      isCustom: false,
    },
    label: 'Google',
  },
  discord: {
    icon: {
      name: 'discord',
      isCustom: false,
    },
    label: 'Discord',
  },
  x: {
    icon: {
      name: 'x',
      isCustom: true,
    },
    label: 'X (Twitter)',
  },
  github: {
    icon: {
      name: 'github',
      isCustom: false,
    },
    label: 'Github',
  },
  email: {
    icon: {
      name: 'email',
      isCustom: true,
    },
    label: 'Email',
  },
};
