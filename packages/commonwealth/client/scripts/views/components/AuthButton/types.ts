import {
  CustomIconName,
  IconName,
} from '../component_kit/cw_icons/cw_icon_lookup';

export type AuthSSOs = 'google' | 'discord' | 'x' | 'github';
export type AuthWallets =
  | 'keplr'
  | 'leap'
  | 'phantom'
  | 'polkadot'
  | 'NO_WALLETS_FOUND';
export type AuthTypes = 'walletConnect' | AuthWallets | AuthSSOs | 'email';

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
};
