import { getUniqueUserAddresses } from 'helpers/user';
import React, { useEffect, useState } from 'react';
import { useWelcomeOnboardModal } from 'state/ui/modals';
import { CWModal } from '../../components/component_kit/new_designs/CWModal';
import './AuthModal.scss';
import { AuthTypeGuidanceModal } from './AuthTypeGuidanceModal';
import { CreateAccountModal } from './CreateAccountModal';
import { SignInModal } from './SignInModal';
import { AuthModalProps, AuthModalType } from './types';

const AuthModal = ({
  type = AuthModalType.SignIn,
  isOpen,
  onClose,
  onSuccess,
  showWalletsFor,
  onSignInClick,
}: AuthModalProps) => {
  const [modalType, setModalType] = useState(type);
  const { setIsWelcomeOnboardModalOpen } = useWelcomeOnboardModal();

  useEffect(() => {
    // reset `modalType` state whenever modal is opened
    isOpen && setModalType(type);
  }, [isOpen, type]);

  const handleOnSignInClick = () => {
    // switch to sign-in modal if user click on `Sign in`.
    if (modalType === AuthModalType.CreateAccount) {
      setModalType(AuthModalType.SignIn);
    }

    // @ts-expect-error StrictNullChecks
    onSignInClick();
  };

  const handleSuccess = (isNewlyCreated) => {
    const userUniqueAddresses = getUniqueUserAddresses({});

    // open welcome modal only if there is a single connected address
    if (isNewlyCreated && userUniqueAddresses.length === 1) {
      // using timeout to make the modal transition smooth
      setTimeout(() => {
        setIsWelcomeOnboardModalOpen(true);
      }, 1000);
    }
    onSuccess?.(isNewlyCreated);
  };

  const getActiveModalComponent = () => {
    switch (modalType) {
      case AuthModalType.AccountTypeGuidance: {
        return (
          <AuthTypeGuidanceModal
            onClose={onClose}
            onSuccess={handleSuccess}
            onSignInClick={handleOnSignInClick}
            onChangeModalType={(selectedType) => setModalType(selectedType)}
          />
        );
      }
      case AuthModalType.CreateAccount: {
        return (
          <CreateAccountModal
            onClose={onClose}
            onSuccess={handleSuccess}
            onSignInClick={handleOnSignInClick}
            onChangeModalType={(selectedType) => setModalType(selectedType)}
          />
        );
      }
      case AuthModalType.SignIn: {
        return (
          <SignInModal
            onClose={onClose}
            onSuccess={handleSuccess}
            showWalletsFor={showWalletsFor}
            onSignInClick={handleOnSignInClick}
            onChangeModalType={(selectedType) => setModalType(selectedType)}
          />
        );
      }
    }
  };

  return (
    <CWModal
      key={type}
      open={isOpen}
      onClose={onClose}
      size="medium"
      className="AuthModal"
      content={getActiveModalComponent()}
    />
  );
};

export { AuthModal };
