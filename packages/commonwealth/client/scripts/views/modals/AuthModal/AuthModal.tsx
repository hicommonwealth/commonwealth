import { getUniqueUserAddresses } from 'client/scripts/helpers/user';
import { useFlag } from 'client/scripts/hooks/useFlag';
import { useWelcomeOnboardModal } from 'client/scripts/state/ui/modals';
import React, { useEffect, useState } from 'react';
import { CWModal } from '../../components/component_kit/new_designs/CWModal';
import './AuthModal.scss';
import { AuthTypeGuidanceModal } from './AuthTypeGuidanceModal';
import { CreateAccountModal } from './CreateAccountModal';
import { RevalidateSessionModal } from './RevalidateSessionModal';
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
  const userOnboardingEnabled = useFlag('userOnboardingEnabled');
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

    onSignInClick();
  };

  const handleSuccess = (isNewlyCreated) => {
    const userUniqueAddresses = getUniqueUserAddresses({});

    // open welcome modal only if there is a single connected address
    if (
      userOnboardingEnabled &&
      isNewlyCreated &&
      userUniqueAddresses.length === 1
    ) {
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
      onChangeModalType: (selectedType) => setModalType(selectedType),
    };

    switch (modalType) {
      case AuthModalType.AccountTypeGuidance: {
        return <AuthTypeGuidanceModal {...commonVariantProps} />;
      }
      case AuthModalType.CreateAccount: {
        return <CreateAccountModal {...commonVariantProps} />;
      }
      case AuthModalType.SignIn: {
        return <SignInModal {...commonVariantProps} />;
      }
      case AuthModalType.RevalidateSession: {
        return <RevalidateSessionModal {...commonVariantProps} />;
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
