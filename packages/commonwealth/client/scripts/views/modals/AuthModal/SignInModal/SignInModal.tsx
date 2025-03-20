import { isMobileApp } from 'hooks/useReactNativeWebView';
import React from 'react';
import { ModalBase } from '../common/ModalBase';
import { AuthModalType, ModalVariantProps } from '../types';
import './SignInModal.scss';

const mobileApp = isMobileApp();

const SignInModal = ({
  onClose,
  onSuccess,
  showWalletsFor,
  showAuthOptionFor,
  showAuthOptionTypesFor,
  onSignInClick,
  triggerOpenEVMWalletsSubModal,
  isUserFromWebView,
}: ModalVariantProps) => {
  return (
    <ModalBase
      onClose={onClose}
      layoutType={AuthModalType.SignIn}
      onSuccess={onSuccess}
      showAuthOptionTypesFor={showAuthOptionTypesFor}
      showWalletsFor={showWalletsFor}
      showAuthOptionFor={showAuthOptionFor}
      bodyClassName="SignInModal"
      onSignInClick={onSignInClick}
      triggerOpenEVMWalletsSubModal={triggerOpenEVMWalletsSubModal}
      isUserFromWebView={mobileApp || isUserFromWebView}
    />
  );
};

export { SignInModal };
