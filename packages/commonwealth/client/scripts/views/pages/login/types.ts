import { IWebWallet } from 'client/scripts/models';
import { ProfileRowAttrs } from '../../components/component_kit/cw_profiles_list';

export type LoginSidebarType =
  | 'connectWallet'
  | 'communityWalletOptions'
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
  setAddress: (address: string) => void;
  bodyType: string;
  setBodyType: (bodyType: string) => void;
  handleSetAvatar: () => void;
  handleSetUsername: () => void;
  profiles: Array<ProfileRowAttrs>;
  setProfiles: (profiles: Array<ProfileRowAttrs>) => void;
  sidebarType?: string;
  setSidebarType: (sidebarType: string) => void;
  username: string;
  wallets: Array<IWebWallet<any>>;
  setWallets: (wallets: Array<string>) => void;
  linkExistingAccountCallback: () => void;
  createNewAccountCallback: () => void;
  accountVerifiedCallback: () => void;
  logInWithAccountCallback: () => void;
  saveProfileInfoCallback: () => void;
  performLinkingCallback: () => void;
};
