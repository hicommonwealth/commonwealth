import { useFlag } from 'hooks/useFlag';
import { useCommonNavigate } from 'navigation/helpers';
import React, { useCallback } from 'react';
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
  const navigate = useCommonNavigate();
  const privyEnabled = useFlag('privy');

  const handleSignIn = useCallback(() => {
    if (privyEnabled) {
      navigate('/sign-in');
    } else {
      onButtonClick(AuthModalType.SignIn);
    }
  }, [navigate, onButtonClick, privyEnabled]);

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
