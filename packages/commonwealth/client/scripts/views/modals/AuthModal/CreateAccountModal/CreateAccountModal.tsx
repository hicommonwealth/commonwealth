import React from 'react';
import { ModalBase } from '../common/ModalBase';
import { AuthModalType, ModalVariantProps } from '../types';
import './CreateAccountModal.scss';

const CreateAccountModal = ({
  onClose,
  onSuccess,
  showWalletsFor,
  showAuthOptionTypesFor,
  showAuthOptionFor,
  onSignInClick,
}: ModalVariantProps) => {
  return (
    <ModalBase
      onClose={onClose}
      onSuccess={onSuccess}
      layoutType={AuthModalType.CreateAccount}
      showWalletsFor={showWalletsFor}
      showAuthOptionTypesFor={showAuthOptionTypesFor}
      showAuthOptionFor={showAuthOptionFor}
      bodyClassName="CreateAccountModal"
      onSignInClick={onSignInClick}
    />
  );
};

export { CreateAccountModal };
