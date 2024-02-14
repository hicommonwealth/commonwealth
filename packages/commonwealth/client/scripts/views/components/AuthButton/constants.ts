import { AuthTypesList } from './types';

// A list of all the available auth types, with config for rendering the button
export const AUTH_TYPES: AuthTypesList = {
  // general
  walletconnect: {
    icon: {
      name: 'walletconnect',
      isCustom: true,
    },
    label: 'WalletConnect',
    description: {
      text: 'All Ethereum Wallets',
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
  phantom: {
    icon: {
      name: 'phantom',
      isCustom: true,
    },
    label: 'Phantom',
    description: {
      text: 'Solana Communities',
      hasBackground: false,
    },
  },
  polkadot: {
    icon: {
      name: 'polkadot',
      isCustom: true,
    },
    label: 'Polkadot',
    description: {
      text: 'Substrate Communities',
      hasBackground: false,
    },
  },
  metamask: {
    icon: {
      name: 'metamask',
      isCustom: true,
    },
    label: 'Metamask',
  },
  coinbase: {
    icon: {
      name: 'coinbase',
      isCustom: true,
    },
    label: 'Coinbase',
  },
  near: {
    icon: {
      name: 'near',
      isCustom: true,
    },
    label: 'Near',
  },
  ronin: {
    icon: {
      name: 'ronin',
      isCustom: true,
    },
    label: 'Ronin',
  },
  terrastation: {
    icon: {
      name: 'terrastation',
      isCustom: true,
    },
    label: 'Station',
  },
  'terra-walletconnect': {
    icon: {
      name: 'terra-walletconnect',
      isCustom: true,
    },
    label: 'WalletConnect (Terra)',
  },
  'cosm-metamask': {
    icon: {
      name: 'cosm-metamask',
      isCustom: true,
    },
    label: 'Metamask',
  },
  'keplr-ethereum': {
    icon: {
      name: 'keplr-ethereum',
      isCustom: true,
    },
    label: 'Keplr',
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
  apple: {
    icon: {
      name: 'apple',
      isCustom: true,
    },
    label: 'Apple',
  },
  email: {
    icon: {
      name: 'email',
      isCustom: true,
    },
    label: 'Email',
  },
};
