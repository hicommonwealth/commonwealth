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
  backpack: {
    icon: {
      name: 'backpack',
      isCustom: true,
    },
    label: 'Backpack',
    description: {
      text: 'Solana Communities',
      hasBackground: false,
    },
  },
  solflare: {
    icon: {
      name: 'solflare',
      isCustom: true,
    },
    label: 'Solflare',
    description: {
      text: 'Solana Communities',
      hasBackground: false,
    },
  },
  'sui-wallet': {
    icon: {
      name: 'sui',
      isCustom: true,
    },
    label: 'Sui Wallet',
    description: {
      text: 'Sui Communities',
      hasBackground: false,
    },
  },
  suiet: {
    icon: {
      name: 'suiet',
      isCustom: true,
    },
    label: 'Suiet Wallet',
    description: {
      text: 'Sui Communities',
      hasBackground: false,
    },
  },
  'okx-wallet': {
    icon: {
      name: 'okx',
      isCustom: true,
    },
    label: 'OKX Wallet',
    description: {
      text: 'Sui Communities',
      hasBackground: false,
    },
  },
  bitget: {
    icon: {
      name: 'bitget',
      isCustom: true,
    },
    label: 'Bitget Wallet',
    description: {
      text: 'Sui Communities',
      hasBackground: false,
    },
  },
  okx: {
    icon: {
      name: 'okx',
      isCustom: true,
    },
    label: 'OKX Wallet',
    description: {
      text: '+10 Aura w/ OKX Signup',
      hasBackground: true,
    },
  },
  binance: {
    icon: {
      name: 'binance',
      isCustom: true,
    },
    label: 'Binance Wallet',
    description: {
      text: '+10 Aura w/ Binance Signup',
      hasBackground: true,
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
  SMS: {
    icon: {
      name: 'SMS',
      isCustom: true,
    },
    label: 'SMS',
  },
  farcaster: {
    icon: {
      name: 'farcaster',
      isCustom: true,
    },
    label: 'Farcaster',
  },
  telegram: {
    icon: {
      name: 'telegram',
      isCustom: false,
    },
    label: 'Telegram',
  },
  tiktok: {
    icon: {
      name: 'tiktok',
      isCustom: false,
    },
    label: 'TikTok',
  },
  warpcast: {
    icon: {
      name: 'warpcast',
      isCustom: false,
    },
    label: 'Warpcast',
  },
  element: {
    icon: {
      name: 'element',
      isCustom: false,
    },
    label: 'Element',
  },
  website: {
    icon: {
      name: 'website',
      isCustom: false,
    },
    label: 'Website',
  },
};
