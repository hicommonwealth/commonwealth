import React from 'react';
import { ModalBase } from '../common/ModalBase';
import { ModalVariantProps } from '../types';
import './SignInModal.scss';

const SignInModal = ({
  onClose,
  onSuccess,
  showWalletsFor,
}: ModalVariantProps) => {
  return (
    <ModalBase
      onClose={onClose}
      layoutType="sign-in"
      onSuccess={onSuccess}
      showAuthenticationOptionsFor={['wallets', 'sso']}
      showWalletsFor={showWalletsFor}
      bodyClassName="SignInModal"
    />
  );
};

export { SignInModal };
