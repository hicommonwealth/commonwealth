import { ProfileRowAttrs } from '../../components/component_kit/cw_profiles_list';

export type LoginSidebarType =
  | 'connectWallet'
  | 'ethWallet'
  | 'newAddressLinked'
  | 'newOrReturning';

export type LoginBodyType =
  | 'allSet'
  | 'connectWithEmail'
  | 'ethWalletList'
  | 'selectAccountType'
  | 'selectPrevious'
  | 'selectProfile'
  | 'walletList'
  | 'welcome';

export type LoginAttrs = {
  address: string;
  bodyType: string;
  handleSetAvatar: () => void;
  handleSetUsername: () => void;
  profiles: Array<ProfileRowAttrs>;
  sidebarType?: string;
  username: string;
  wallets: Array<string>;
};
