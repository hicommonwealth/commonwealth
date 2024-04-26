import React, { useEffect, useState } from 'react';
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
  onSignInClick,
}: AuthModalProps) => {
  const [modalType, setModalType] = useState(type);

  useEffect(() => {
    // reset `modalType` state whenever modal is opened
    isOpen && setModalType(type);
  }, [isOpen, type]);

  const handleOnSignInClick = () => {
    // switch to sign-in modal if user click on `Sign in`.
    if (modalType === 'create-account') {
      setModalType('sign-in');
    }

    onSignInClick();
  };

  return (
    <CWModal
      key={type}
      open={isOpen}
      onClose={onClose}
      size="medium"
      className="AuthModal"
      content={
        modalType === 'sign-in' ? (
          <SignInModal
            onClose={onClose}
            onSuccess={onSuccess}
            showWalletsFor={showWalletsFor}
            onSignInClick={handleOnSignInClick}
          />
        ) : (
          <CreateAccountModal
            onClose={onClose}
            onSignInClick={handleOnSignInClick}
          />
        )
      }
    />
  );
};

export { AuthModal };
