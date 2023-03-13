import React, { useEffect, useState } from 'react';

import 'pages/landing/header.scss';

import { LoginModal } from 'views/modals/login_modal';
import { isWindowMediumSmallInclusive } from '../../components/component_kit/helpers';
import { Modal } from '../../components/component_kit/cw_modal';
import { useCommonNavigate } from 'navigation/helpers';
import { CWIconButton } from '../../components/component_kit/cw_icon_button';
import { CWText } from '../../components/component_kit/cw_text';
import { CWButton } from '../../components/component_kit/cw_button';

type HeaderProps = {
  onLogin: () => void;
};

export const Header = ({ onLogin }: HeaderProps) => {
  const navigate = useCommonNavigate();

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [windowIsMediumSmallInclusive, setWindowIsMediumSmallInclusive] =
    useState(isWindowMediumSmallInclusive(window.innerWidth));

  useEffect(() => {
    const onResize = () => {
      setWindowIsMediumSmallInclusive(
        isWindowMediumSmallInclusive(window.innerWidth)
      );
    };

    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <>
      <div className="Header">
        <img
          src="static/img/commonLogoWithText.svg"
          alt="Commonwealth"
          className="logo-with-text"
        />
        {windowIsMediumSmallInclusive ? (
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
              label="Login"
              buttonType="primary-black"
              onClick={() => setIsModalOpen(true)}
            />
          </div>
        )}
      </div>
      <Modal
        content={
          <LoginModal
            onSuccess={onLogin}
            onModalClose={() => setIsModalOpen(false)}
          />
        }
        isFullScreen={windowIsMediumSmallInclusive}
        onClose={() => setIsModalOpen(false)}
        open={isModalOpen}
      />
    </>
  );
};
