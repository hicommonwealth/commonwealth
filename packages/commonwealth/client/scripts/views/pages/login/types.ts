import type Account from '../../../models/Account';
import type IWebWallet from '../../../models/IWebWallet';
import type { ProfileRowProps } from '../../components/component_kit/cw_profiles_list';

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

export type LoginProps = {
  address: string;
  currentlyInCommunityPage: boolean;
  bodyType: LoginBodyType;
  profiles: Array<ProfileRowProps>;
  sidebarType: LoginSidebarType;
  username: string;
  wallets: Array<IWebWallet<any>>;
  magicLoading: boolean;
  setAddress: (address: string) => void;
  setBodyType: (bodyType: LoginBodyType) => void;
  handleEmailLoginCallback: () => void;
  handleSetAvatar: (avatarUrl: string) => void;
  handleSetUsername: (username: string) => void;
  handleSetEmail: (e: any) => void;
  setProfiles: (profiles: Array<ProfileRowProps>) => void;
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
  onModalClose: () => void;
};
