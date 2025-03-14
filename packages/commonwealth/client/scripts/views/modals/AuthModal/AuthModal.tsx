import { WalletSsoSource } from '@hicommonwealth/shared';
import useBrowserWindow from 'client/scripts/hooks/useBrowserWindow';
import { getUniqueUserAddresses } from 'helpers/user';
import { isMobileApp } from 'hooks/useReactNativeWebView';
import React, { useEffect, useState } from 'react';
import { useAuthModalStore, useWelcomeOnboardModal } from 'state/ui/modals';
import { AuthTypes } from 'views/components/AuthButton/types';
import { CWModal } from 'views/components/component_kit/new_designs/CWModal';
import './AuthModal.scss';
import { CreateAccountModal } from './CreateAccountModal';
import { RevalidateSessionModal } from './RevalidateSessionModal';
import { SignInModal } from './SignInModal';
import { AuthModalProps, AuthModalType, AuthOptionTypes } from './types';

const mobileApp = isMobileApp();

const AuthModal = ({
  type = AuthModalType.SignIn,
  isOpen,
  triggerOpenEVMWalletsSubModal,
  onClose,
  onSuccess,
  showWalletsFor,
  showAuthOptionTypesFor,
  isUserFromWebView,
}: AuthModalProps) => {
  const [modalType, setModalType] = useState(type);
  const { sessionKeyValidationError } = useAuthModalStore();
  const { setIsWelcomeOnboardModalOpen } = useWelcomeOnboardModal();
  const { isWindowSmallInclusive } = useBrowserWindow({});
  useEffect(() => {
    // reset `modalType` state whenever modal is opened
    isOpen && setModalType(type);
  }, [isOpen, type]);

  const handleOnSignInClick = () => {
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
      showAuthOptionTypesFor: (showAuthOptionTypesFor
        ? showAuthOptionTypesFor
        : mobileApp
          ? ['sso']
          : ['wallets', 'sso']) as AuthOptionTypes[],
      onSignInClick: handleOnSignInClick,
      triggerOpenEVMWalletsSubModal,
      isUserFromWebView,
    };

    switch (modalType) {
      case AuthModalType.CreateAccount: {
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
              sessionKeyValidationError?.ssoSource !==
                WalletSsoSource.Unknown && {
                showAuthOptionFor:
                  sessionKeyValidationError?.ssoSource as AuthTypes,
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
      isFullScreen={isWindowSmallInclusive}
    />
  );
};

export { AuthModal };
