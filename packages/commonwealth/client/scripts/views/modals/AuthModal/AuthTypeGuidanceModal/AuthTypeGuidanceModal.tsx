import React from 'react';
import { ModalBase } from '../common/ModalBase';
import { AuthModalType, ModalVariantProps } from '../types';
import './AuthTypeGuidanceModal.scss';
import { Option } from './Option';

const AuthTypeGuidanceModal = ({
  onClose,
  onSuccess,
  showWalletsFor,
}: ModalVariantProps) => {
  return (
    <ModalBase
      onClose={onClose}
      onSuccess={onSuccess}
      layoutType={AuthModalType.AccountTypeGuidance}
      showWalletsFor={showWalletsFor}
      customBody={
        <>
          <Option type={AuthModalType.CreateAccount} onClick={() => null} />
          <Option type={AuthModalType.SignIn} onClick={() => null} />
        </>
      }
      bodyClassName="AuthTypeGuidanceModal"
    />
  );
};

export { AuthTypeGuidanceModal };
