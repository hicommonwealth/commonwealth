import React from 'react';
import { ModalBase } from '../common/ModalBase';
import { AuthModalType, ModalVariantProps } from '../types';
import './SignInModal.scss';

const SignInModal = ({
  onClose,
  onSuccess,
  showWalletsFor,
  showAuthOptionFor,
  onSignInClick,
}: ModalVariantProps) => {
  return (
    <ModalBase
      onClose={onClose}
      layoutType={AuthModalType.SignIn}
      onSuccess={onSuccess}
      showAuthOptionTypesFor={['wallets', 'sso']}
      showWalletsFor={showWalletsFor}
      showAuthOptionFor={showAuthOptionFor}
      bodyClassName="SignInModal"
      onSignInClick={onSignInClick}
    />
  );
};

export { SignInModal };
