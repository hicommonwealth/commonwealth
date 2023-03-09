import React, { useEffect, useState } from 'react';

import 'pages/landing/landing_page_header.scss';

import { LoginModal } from 'views/modals/login_modal';
import { isWindowMediumSmallInclusive } from '../../components/component_kit/helpers';
import { Modal } from '../../components/component_kit/cw_modal';
import { useCommonNavigate } from 'navigation/helpers';
import { CWIconButton } from '../../components/component_kit/cw_icon_button';
import { CWText } from '../../components/component_kit/cw_text';
import { CWButton } from '../../components/component_kit/cw_button';

type LandingPageHeaderProps = {
  onLogin: () => void;
};

export const LandingPageHeader = ({ onLogin }: LandingPageHeaderProps) => {
  const navigate = useCommonNavigate();

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
          <>
            <CWText onClick={() => navigate('/whyCommonwealth')}>
              Why Commonwealth?
            </CWText>
            <CWButton label="Login" buttonType="primary-black" />
          </>
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
