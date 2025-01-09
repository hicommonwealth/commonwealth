import React from 'react';
import { useMobileLoginTrigger } from 'views/components/ReactNativeBridge';
import { AuthModalType } from '../../modals/AuthModal';
import { CWButton } from '../component_kit/new_designs/CWButton';

type AuthButtonsProps = {
  onButtonClick: (selectedFlow: AuthModalType) => void;
  fullWidthButtons?: boolean;
  smallHeightButtons?: boolean;
};

const AuthButtons = ({
  onButtonClick,
  fullWidthButtons = false,
  smallHeightButtons = false,
}: AuthButtonsProps) => {
  const isDisabled = location.pathname.includes('/finishsociallogin');

  const mobileLoginTrigger = useMobileLoginTrigger();

  function handleSignIn() {
    if (mobileLoginTrigger.enabled) {
      mobileLoginTrigger.trigger();
    } else {
      onButtonClick(AuthModalType.SignIn);
    }
  }

  return (
    <>
      <CWButton
        buttonType="secondary"
        label="Create account"
        {...(smallHeightButtons && {
          buttonHeight: 'sm',
        })}
        buttonWidth={fullWidthButtons ? 'full' : 'narrow'}
        disabled={isDisabled}
        onClick={() => onButtonClick(AuthModalType.CreateAccount)}
      />
      <CWButton
        buttonType="primary"
        label="Sign in"
        {...(smallHeightButtons && {
          buttonHeight: 'sm',
        })}
        buttonWidth={fullWidthButtons ? 'full' : 'narrow'}
        disabled={isDisabled}
        onClick={handleSignIn}
      />
    </>
  );
};

export default AuthButtons;
