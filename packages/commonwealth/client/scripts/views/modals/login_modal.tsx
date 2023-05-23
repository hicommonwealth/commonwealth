import 'components/component_kit/cw_wallets_list.scss';
import React from 'react';
import useWallets from '../../hooks/useWallets';
import Account from '../../models/Account';
import IWebWallet from '../../models/IWebWallet';
import { LoginDesktop } from '../pages/login/login_desktop';
import { LoginMobile } from '../pages/login/login_mobile';
import type { LoginActiveStep, LoginSidebarType } from '../pages/login/types';

type LoginModalAttrs = {
  initialBody?: LoginActiveStep;
  initialSidebar?: LoginSidebarType;
  initialAccount?: Account;
  initialWallets?: IWebWallet<any>[];
  onSuccess?: () => void;
  onModalClose: () => void;
};

export const LoginModal = (props: LoginModalAttrs) => {
  const {
    showMobile,
    isNewlyCreated,
    isInCommunityPage,
    isLinkingOnMobile,
    signerAccount,
    address,
    activeStep,
    profiles,
    sidebarType,
    username,
    wallets,
    isMagicLoading,
    isWalletConnectEnabled,
    onCreateNewAccount,
    onWalletAddressSelect,
    onWalletSelect,
    onSaveProfileInfo,
    onResetWalletConnect,
    onPerformLinking,
    onEmailLogin,
    onSocialLogin,
    onLinkExistingAccount,
    setAvatarUrl,
    setEmail,
    onAccountVerified,
    setAddress,
    setActiveStep,
    setUsername,
    setSidebarType,
  } = useWallets(props);

  const LoginModule = showMobile ? LoginMobile : LoginDesktop;

  return (
    <LoginModule
      isNewlyCreated={isNewlyCreated}
      isLinkingOnMobile={isLinkingOnMobile}
      signerAccount={signerAccount}
      address={address}
      isInCommunityPage={isInCommunityPage}
      activeStep={activeStep}
      profiles={profiles}
      sidebarType={sidebarType}
      username={username}
      wallets={wallets}
      isMagicLoading={isMagicLoading}
      canResetWalletConnect={isWalletConnectEnabled}
      onCreateNewAccount={onCreateNewAccount}
      onLinkExistingAccount={onLinkExistingAccount}
      onEmailLogin={onEmailLogin}
      onSocialLogin={onSocialLogin}
      onSaveProfileInfo={onSaveProfileInfo}
      onPerformLinking={onPerformLinking}
      onModalClose={props.onModalClose}
      onAccountVerified={onAccountVerified}
      onConnectAnotherWay={() => setActiveStep('connectWithEmail')}
      onResetWalletConnect={onResetWalletConnect}
      onWalletSelect={onWalletSelect}
      onWalletAddressSelect={onWalletAddressSelect}
      setAddress={(a: string) => {
        setAddress(a);
      }}
      setActiveStep={(bT: LoginActiveStep) => {
        setActiveStep(bT);
      }}
      handleSetAvatar={(a) => {
        setAvatarUrl(a);
      }}
      handleSetUsername={(u) => {
        setUsername(u);
      }}
      handleSetEmail={(e) => {
        setEmail(e.target.value);
      }}
      setSidebarType={(sT: LoginSidebarType) => {
        setSidebarType(sT);
      }}
    />
  );
};
