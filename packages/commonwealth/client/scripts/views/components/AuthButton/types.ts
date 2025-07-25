import {
  CustomIconName,
  IconName,
} from '../component_kit/cw_icons/cw_icon_lookup';

export type AuthSSOs =
  | 'google'
  | 'discord'
  | 'x'
  | 'github'
  | 'apple'
  | 'email'
  | 'farcaster'
  | 'SMS'
  | 'telegram'
  | 'tiktok'
  | 'warpcast'
  | 'element'
  | 'website';
export type CosmosWallets = 'keplr' | 'leap';
export type SubstrateWallets = 'polkadot';
export type SolanaWallets = 'phantom' | 'backpack' | 'solflare';
export type SuiWallets = 'sui-wallet' | 'suiet' | 'okx-wallet' | 'bitget';
export type EVMWallets =
  | 'walletconnect'
  | 'metamask'
  | 'coinbase'
  | 'okx'
  | 'binance';
export type CommunitySpecificWallets =
  | 'terrastation'
  | 'terra-walletconnect'
  | 'cosm-metamask'
  | 'keplr-ethereum';
export type AuthWallets =
  | CosmosWallets
  | SolanaWallets
  | SuiWallets
  | SubstrateWallets
  | EVMWallets
  | CommunitySpecificWallets
  | 'NO_WALLETS_FOUND';
export type AuthTypes = AuthWallets | AuthSSOs;

export type AuthButtonConfig = {
  label: string;
  icon: {
    name: IconName | CustomIconName;
    isCustom: boolean;
  };
  description?: {
    text: string;
    hasBackground: boolean;
  };
};

export type AuthTypesList = { [K in AuthTypes]: AuthButtonConfig };

export type AuthButtonProps = {
  type: AuthTypes;
  onClick?: () => any;
  className?: string;
  disabled?: boolean;
  showDescription?: boolean;
  rounded?: boolean;
  variant?: 'light' | 'dark';
};
