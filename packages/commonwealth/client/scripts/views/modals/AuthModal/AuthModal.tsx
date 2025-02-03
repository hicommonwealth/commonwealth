import { getUniqueUserAddresses } from 'helpers/user';
import React, { useEffect, useState } from 'react';
import { useAuthModalStore, useWelcomeOnboardModal } from 'state/ui/modals';
import { AuthSSOs } from '../../components/AuthButton/types';
import { CWModal } from '../../components/component_kit/new_designs/CWModal';
import './AuthModal.scss';
import { CreateAccountModal } from './CreateAccountModal';
import { RevalidateSessionModal } from './RevalidateSessionModal';
import { SignInModal } from './SignInModal';
import { AuthModalProps, AuthModalType } from './types';

const isTelegramWebApp = () => {
  return window.Telegram?.WebApp != null;
};

const AuthModal = ({
  type = AuthModalType.SignIn,
  isOpen,
  onClose,
  onSuccess,
  showWalletsFor,
}: AuthModalProps) => {
  const [modalType, setModalType] = useState(type);
  const { sessionKeyValidationError } = useAuthModalStore();
  const { setIsWelcomeOnboardModalOpen } = useWelcomeOnboardModal();

  useEffect(() => {
    // reset `modalType` state whenever modal is opened
    isOpen && setModalType(type);
  }, [isOpen, type]);

  const handleOnSignInClick = () => {
    // In Telegram WebApp, we only allow Telegram sign-in
    if (isTelegramWebApp()) return;
    // switch to sign-in modal if user click on `Sign in`.
    if (modalType === AuthModalType.CreateAccount) {
      setModalType(AuthModalType.SignIn);
    }
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
    const commonVariantProps = {
      onClose,
      onSuccess: handleSuccess,
      showWalletsFor,
      onSignInClick: handleOnSignInClick,
      // When in Telegram WebApp, only show Telegram auth option
      showAuthOptionFor: isTelegramWebApp()
        ? ('telegram' as AuthSSOs)
        : undefined,
    };

    switch (modalType) {
      case AuthModalType.CreateAccount: {
        // In Telegram WebApp, always show SignIn
        if (isTelegramWebApp()) {
          return <SignInModal {...commonVariantProps} />;
        }
        return <CreateAccountModal {...commonVariantProps} />;
      }
      case AuthModalType.SignIn: {
        return <SignInModal {...commonVariantProps} />;
      }
      case AuthModalType.RevalidateSession: {
        return (
          <RevalidateSessionModal
            {...commonVariantProps}
            // TODO: session keys should support all wallet types, atm they only work with sso
            // this is broken in master branch, create a ticket for fix
            {...(sessionKeyValidationError?.ssoSource &&
              sessionKeyValidationError?.ssoSource !== 'unknown' && {
                showAuthOptionFor:
                  sessionKeyValidationError?.ssoSource as AuthSSOs,
              })}
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
