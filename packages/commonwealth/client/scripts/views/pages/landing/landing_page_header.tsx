import React, { useEffect, useState } from 'react';

import 'pages/landing/landing_page_header.scss';

import { LoginModal } from 'views/modals/login_modal';
import { isWindowMediumSmallInclusive } from '../../components/component_kit/helpers';
import { Modal } from '../../components/component_kit/cw_modal';
import { CWIconButton } from '../../components/component_kit/cw_icon_button';
import { CWButton } from '../../components/component_kit/cw_button';

type LandingPageHeaderProps = {
  onLogin: () => void;
};

export const LandingPageHeader = ({ onLogin }: LandingPageHeaderProps) => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isWindowMediumSmall, setIsWindowMediumSmall] = useState(
    isWindowMediumSmallInclusive(window.innerWidth)
  );

  useEffect(() => {
    const onResize = () => {
      setIsWindowMediumSmall(isWindowMediumSmallInclusive(window.innerWidth));
    };

    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <>
      <div className="LandingPageHeader">
        <img
          src="static/img/commonLogoWithText.svg"
          alt="Commonwealth"
          className="logo-with-text"
        />
        {isWindowMediumSmall ? (
          <CWIconButton
            iconName="hamburger"
            onClick={() => console.log('menu open')}
          />
        ) : (
          <CWButton
            label="Login"
            buttonType="primary-black"
            onClick={() => setIsModalOpen(true)}
          />
        )}
      </div>
      <Modal
        content={
          <LoginModal
            onSuccess={onLogin}
            onModalClose={() => setIsModalOpen(false)}
          />
        }
        isFullScreen={isWindowMediumSmall}
        onClose={() => setIsModalOpen(false)}
        open={isModalOpen}
      />
    </>
  );
};
