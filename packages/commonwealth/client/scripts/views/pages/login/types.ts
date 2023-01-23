import type { Account, IWebWallet } from 'models';
import type { ProfileRowAttrs } from '../../components/component_kit/cw_profiles_list';

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
  bodyType: LoginBodyType;
  profiles: Array<ProfileRowAttrs>;
  sidebarType: LoginSidebarType;
  username: string;
  wallets: Array<IWebWallet<any>>;
  magicLoading: boolean;
  setAddress: (address: string) => void;
  setBodyType: (bodyType: string) => void;
  handleEmailLoginCallback: () => void;
  handleSetAvatar: (url: string) => void;
  handleSetUsername: (username: string) => void;
  handleSetEmail: (e: any) => void;
  setProfiles: (profiles: Array<ProfileRowAttrs>) => void;
  setSidebarType: (sidebarType: string) => void;
  setSelectedWallet: (wallet: IWebWallet<any>) => void;
  setSelectedLinkingWallet: (wallet: IWebWallet<any>) => void;
  linkExistingAccountCallback: () => void;
  createNewAccountCallback: () => void;
  accountVerifiedCallback: (
    account: Account,
    newlyCreated: boolean,
    linking: boolean
  ) => Promise<void>;
  logInWithAccountCallback?: () => void;
  saveProfileInfoCallback: () => void;
  performLinkingCallback: () => void;
  showResetWalletConnect: boolean;
};
