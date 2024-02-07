import React from 'react';
import { CWModal } from '../../components/component_kit/new_designs/CWModal';
import { BaseModal } from './BaseModal';
import { AuthModalProps } from './types';

const AuthModal = ({
  isOpen,
  onClose,
  onSuccess,
  showWalletsFor,
}: AuthModalProps) => {
  return (
    <CWModal
      open={isOpen}
      onClose={onClose}
      size="medium"
      content={
        <BaseModal
          onClose={onClose}
          onSuccess={onSuccess}
          showWalletsFor={showWalletsFor}
        />
      }
    />
  );
};

export { AuthModal };
