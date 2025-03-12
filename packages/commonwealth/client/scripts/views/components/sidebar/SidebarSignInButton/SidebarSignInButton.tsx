import React from 'react';

import { useAuthModalStore } from 'client/scripts/state/ui/modals';
import { AuthModalType } from 'client/scripts/views/modals/AuthModal';
import clsx from 'clsx';
import { CWText } from '../../component_kit/cw_text';
import { CWButton } from '../../component_kit/new_designs/CWButton';
import './SidebarSignInButton.scss';

interface SidebarSignInButtonProps {
  isInsideCommunity: boolean;
}
const SidebarSignInButton = ({
  isInsideCommunity,
}: SidebarSignInButtonProps) => {
  const { setAuthModalType } = useAuthModalStore();
  return (
    <div
      className={clsx(
        'SidebarSignInButton',
        isInsideCommunity ? 'isInsideCommunity' : '',
      )}
    >
      <CWText type="b2" className="sign-in-text">
        Sign in to see your communities on Common.
      </CWText>
      <CWButton
        buttonType="primary"
        label="Sign in"
        buttonWidth="full"
        buttonHeight="sm"
        onClick={() => setAuthModalType(AuthModalType.SignIn)}
      />
    </div>
  );
};

export default SidebarSignInButton;
