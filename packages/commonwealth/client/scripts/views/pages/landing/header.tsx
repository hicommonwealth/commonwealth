import useBrowserWindow from 'hooks/useBrowserWindow';
import { useCommonNavigate } from 'navigation/helpers';
import 'pages/landing/header.scss';
import React, { useState } from 'react';
import { LoginModal } from 'views/modals/login_modal';
import { CWIconButton } from '../../components/component_kit/cw_icon_button';
import { CWText } from '../../components/component_kit/cw_text';
import { CWModal } from '../../components/component_kit/new_designs/CWModal';
import { CWButton } from '../../components/component_kit/new_designs/cw_button';

type HeaderProps = {
  onLogin: () => void;
};

export const Header = ({ onLogin }: HeaderProps) => {
  const navigate = useCommonNavigate();

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
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
            onClick={() => setIsModalOpen(true)}
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
              onClick={() => setIsModalOpen(true)}
            />
          </div>
        )}
      </div>
      <CWModal
        content={
          <LoginModal
            onSuccess={onLogin}
            onModalClose={() => setIsModalOpen(false)}
          />
        }
        isFullScreen={isWindowMediumSmallInclusive}
        onClose={() => setIsModalOpen(false)}
        open={isModalOpen}
      />
    </>
  );
};
