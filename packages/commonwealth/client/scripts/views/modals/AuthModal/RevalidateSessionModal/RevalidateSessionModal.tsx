import React from 'react';
import { ModalBase } from '../common/ModalBase';
import { AuthModalType, ModalVariantProps } from '../types';
import './RevalidateSessionModal.scss';

const RevalidateSessionModal = ({
  onClose,
  onSuccess,
  showWalletsFor,
  showAuthOptionFor,
  showAuthOptionTypesFor,
  onSignInClick,
}: ModalVariantProps) => {
  return (
    <ModalBase
      onClose={onClose}
      layoutType={AuthModalType.RevalidateSession}
      onSuccess={onSuccess}
      showAuthOptionTypesFor={showAuthOptionTypesFor}
      showWalletsFor={showWalletsFor}
      showAuthOptionFor={showAuthOptionFor}
      bodyClassName="RevalidateSessionModal"
      onSignInClick={onSignInClick}
    />
  );
};

export { RevalidateSessionModal };
