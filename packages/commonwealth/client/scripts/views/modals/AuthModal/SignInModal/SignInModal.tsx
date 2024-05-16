import React from 'react';
import { ModalBase } from '../common/ModalBase';
import { AuthModalType, ModalVariantProps } from '../types';
import './SignInModal.scss';

const SignInModal = ({
  onClose,
  onSuccess,
  showWalletsFor,
  onSignInClick,
}: ModalVariantProps) => {
  return (
    <ModalBase
      onClose={onClose}
      layoutType={AuthModalType.SignIn}
      onSuccess={onSuccess}
      showAuthenticationOptionsFor={['wallets', 'sso']}
      showWalletsFor={showWalletsFor}
      bodyClassName="SignInModal"
      onSignInClick={onSignInClick}
    />
  );
};

export { SignInModal };
