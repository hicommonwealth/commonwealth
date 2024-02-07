import { featureFlags } from 'helpers/feature-flags';
import useBrowserWindow from 'hooks/useBrowserWindow';
import { useCommonNavigate } from 'navigation/helpers';
import 'pages/landing/header.scss';
import React, { useState } from 'react';
import { LoginModal } from 'views/modals/login_modal';
import { CWIconButton } from '../../components/component_kit/cw_icon_button';
import { CWText } from '../../components/component_kit/cw_text';
import { CWModal } from '../../components/component_kit/new_designs/CWModal';
import { CWButton } from '../../components/component_kit/new_designs/cw_button';
import { AuthModal } from '../../modals/AuthModal';

type HeaderProps = {
  onLogin: () => void;
};

export const Header = ({ onLogin }: HeaderProps) => {
  const navigate = useCommonNavigate();

  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const { isWindowMediumSmallInclusive } = useBrowserWindow({});

  return (
    <>
      <div className="Header">
        <img
          src="static/img/commonLogoWithText.svg"
          alt="Commonwealth"
          className="logo-with-text"
        />
        {isWindowMediumSmallInclusive ? (
          <CWIconButton
            iconName="hamburger"
            onClick={() => setIsAuthModalOpen(true)}
          />
        ) : (
          <div className="desktop-login">
            <CWText onClick={() => navigate('/whyCommonwealth')}>
              Why Commonwealth?
            </CWText>
            <CWButton
              buttonType="primary"
              buttonHeight="sm"
              label="Sign in"
              onClick={() => setIsAuthModalOpen(true)}
            />
          </div>
        )}
      </div>
      {!featureFlags.newSignInModal ? (
        <CWModal
          content={
            <LoginModal
              onSuccess={onLogin}
              onModalClose={() => setIsAuthModalOpen(false)}
            />
          }
          isFullScreen={isWindowMediumSmallInclusive}
          onClose={() => setIsAuthModalOpen(false)}
          open={isAuthModalOpen}
        />
      ) : (
        <AuthModal
          onClose={() => setIsAuthModalOpen(false)}
          isOpen={isAuthModalOpen}
        />
      )}
    </>
  );
};
