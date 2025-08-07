import React, { useCallback } from 'react';
import { AuthModalType } from '../../modals/AuthModal';
import { CWButton } from '../component_kit/CWButton';

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
  const handleSignIn = useCallback(() => {
    onButtonClick(AuthModalType.SignIn);
  }, [onButtonClick]);

  const isDisabled = location.pathname.includes('/finishsociallogin');

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
