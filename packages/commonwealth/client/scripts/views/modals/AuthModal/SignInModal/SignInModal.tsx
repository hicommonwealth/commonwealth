import React from 'react';
import { ModalBase } from '../common/ModalBase';
import { SignInModalProps } from '../types';
import './SignInModal.scss';

const SignInModal = ({
  onClose,
  onSuccess,
  showWalletsFor,
}: SignInModalProps) => {
  return (
    <ModalBase
      onClose={onClose}
      layoutType="sign-in"
      onAuthenticated={() => onSuccess()}
      showAuthenticationOptionsFor={['wallets', 'sso']}
      showWalletsFor={showWalletsFor}
      bodyClassName="SignInModal"
    />
  );
};

export { SignInModal };
