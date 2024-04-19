import React from 'react';
import { CWModal } from '../../components/component_kit/new_designs/CWModal';
import './AuthModal.scss';
import { CreateAccountModal } from './CreateAccountModal';
import { SignInModal } from './SignInModal';
import { AuthModalProps } from './types';

const AuthModal = ({
  type = 'sign-in',
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
      className="AuthModal"
      content={
        type === 'sign-in' ? (
          <SignInModal
            onClose={onClose}
            onSuccess={onSuccess}
            showWalletsFor={showWalletsFor}
          />
        ) : (
          <CreateAccountModal onClose={onClose} />
        )
      }
    />
  );
};

export { AuthModal };
