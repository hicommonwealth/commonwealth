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
  currentlyInCommunityPage: boolean;
  bodyType: string;
  profiles: Array<ProfileRowAttrs>;
  sidebarType: string;
  username: string;
  wallets: Array<IWebWallet<any>>;
  magicLoading: boolean;
  setAddress: (address: string) => void;
  setBodyType: (bodyType: string) => void;
  handleSetAvatar: () => void;
  handleSetUsername: () => void;
  handleSetEmail: () => void;
  setProfiles: (profiles: Array<ProfileRowAttrs>) => void;
  setSidebarType: (sidebarType: string) => void;
  setSelectedWallet: (wallet: IWebWallet<any>) => void;
  setSelectedLinkingWallet: (wallet: IWebWallet<any>) => void;
  linkExistingAccountCallback: () => void;
  createNewAccountCallback: () => void;
  accountVerifiedCallback: () => void;
  logInWithAccountCallback: () => void;
  saveProfileInfoCallback: () => void;
  performLinkingCallback: () => void;
  showResetWalletConnect: boolean;
};
