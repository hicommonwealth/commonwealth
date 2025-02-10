import { isMobileApp } from 'client/scripts/hooks/useReactNativeWebView';
import React from 'react';
import { ModalBase } from '../common/ModalBase';
import { AuthModalType, ModalVariantProps } from '../types';
import './CreateAccountModal.scss';
const mobileApp = isMobileApp();
const CreateAccountModal = ({
  onClose,
  onSuccess,
  showWalletsFor,
  showAuthOptionFor,
  onSignInClick,
}: ModalVariantProps) => {
  return (
    <ModalBase
      onClose={onClose}
      onSuccess={onSuccess}
      layoutType={AuthModalType.CreateAccount}
      showWalletsFor={showWalletsFor}
      showAuthOptionTypesFor={mobileApp ? ['sso'] : ['wallets', 'sso']}
      showAuthOptionFor={showAuthOptionFor}
      bodyClassName="CreateAccountModal"
      onSignInClick={onSignInClick}
    />
  );
};

export { CreateAccountModal };
