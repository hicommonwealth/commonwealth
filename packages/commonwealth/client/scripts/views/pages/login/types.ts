import type { WalletSsoSource } from '@hicommonwealth/core';
import Account from '../../../models/Account';
import IWebWallet from '../../../models/IWebWallet';
import type { ProfileRowProps } from '../../components/component_kit/cw_profiles_list';

export type LoginSidebarType =
  | 'connectWallet'
  | 'emailLogin'
  | 'communityWalletOptions'
  | 'newAddressLinked'
  | 'newOrReturning'
  | 'createCommunityLogin';

export type LoginActiveStep =
  | 'allSet'
  | 'connectWithEmail'
  | 'redirectToSign'
  | 'ethWalletList'
  | 'selectAccountType'
  | 'selectPrevious'
  | 'selectProfile'
  | 'walletList'
  | 'welcome';

export type LoginProps = {
  isNewlyCreated: boolean;
  isLinkingOnMobile: boolean;
  signerAccount: Account;
  address: string;
  isInCommunityPage: boolean;
  activeStep: LoginActiveStep;
  profiles: Array<ProfileRowProps>;
  sidebarType: LoginSidebarType;
  username: string;
  wallets: Array<IWebWallet<any>>;
  isMagicLoading: boolean;
  setAddress: (address: string) => void;
  setActiveStep: (activeStep: LoginActiveStep) => void;
  handleSetAvatar: (avatarUrl: string) => void;
  handleSetUsername: (username: string) => void;
  handleSetEmail: (e: any) => void;
  setSidebarType: (sidebarType: string) => void;
  canResetWalletConnect: boolean;
  onEmailLogin: () => Promise<void>;
  onSocialLogin: (provider: WalletSsoSource) => Promise<void>;
  onConnectAnotherWay: () => void;
  onLinkExistingAccount: () => void;
  onCreateNewAccount: () => void;
  onAccountLogin?: () => void;
  onSaveProfileInfo: () => void;
  onPerformLinking: () => void;
  onModalClose: () => void;
  onResetWalletConnect: () => void;
  onAccountVerified: (
    account: Account,
    newlyCreated: boolean,
    linking: boolean,
  ) => Promise<void>;
  onWalletSelect: (wallet: IWebWallet<any>) => Promise<void>;
  onWalletAddressSelect: (
    wallet: IWebWallet<any>,
    address: string,
  ) => Promise<void>;
  onNavigateToWalletList: () => void;
};
