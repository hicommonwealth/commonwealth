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
  console.log(
    '[AuthModal] Initializing with type:',
    type,
    'showWalletsFor:',
    showWalletsFor,
  );

  const [modalType, setModalType] = useState(type);
  const { sessionKeyValidationError } = useAuthModalStore();
  const { setIsWelcomeOnboardModalOpen } = useWelcomeOnboardModal();
  const { isWindowSmallInclusive } = useBrowserWindow({});

  useEffect(() => {
    // reset `modalType` state whenever modal is opened
    if (isOpen) {
      console.log('[AuthModal] Modal opened with type:', type);
      setModalType(type);
    }
  }, [isOpen, type]);

  const handleOnSignInClick = () => {
    console.log('[AuthModal] Sign in button clicked');
    // switch to sign-in modal if user click on `Sign in`.
    if (modalType === AuthModalType.CreateAccount) {
      setModalType(AuthModalType.SignIn);
    }
  };

  const handleSuccess = (isNewlyCreated) => {
    console.log(
      '[AuthModal] Authentication successful, isNewlyCreated:',
      isNewlyCreated,
    );
    const userUniqueAddresses = getUniqueUserAddresses({});
    console.log('[AuthModal] User unique addresses:', userUniqueAddresses);

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
    console.log(
      '[AuthModal] Getting active modal component for type:',
      modalType,
    );
    console.log('[AuthModal] showAuthOptionTypesFor:', showAuthOptionTypesFor);
    console.log('[AuthModal] showWalletsFor:', showWalletsFor);

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
