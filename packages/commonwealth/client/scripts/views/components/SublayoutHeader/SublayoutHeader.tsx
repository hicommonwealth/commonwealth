import clsx from 'clsx';
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import app from 'state';

import { useFlag } from 'hooks/useFlag';
import useUserLoggedIn from 'hooks/useUserLoggedIn';
import { useCommonNavigate } from 'navigation/helpers';
import useSidebarStore from 'state/ui/sidebar';
import MobileHeader from 'views/components/SublayoutHeader/MobileHeader';
import UserDropdown from 'views/components/SublayoutHeader/UserDropdown/UserDropdown';
import { CWDivider } from 'views/components/component_kit/cw_divider';
import { CWIconButton } from 'views/components/component_kit/cw_icon_button';
import {
  isWindowMediumSmallInclusive,
  isWindowSmallInclusive,
} from 'views/components/component_kit/helpers';
import { CWModal } from 'views/components/component_kit/new_designs/CWModal';
import { CWSearchBar } from 'views/components/component_kit/new_designs/CWSearchBar';
import { CWTooltip } from 'views/components/component_kit/new_designs/CWTooltip';
import { CWButton } from 'views/components/component_kit/new_designs/cw_button';
import { CreateContentPopover } from 'views/menus/create_content_menu';
import { HelpMenuPopover } from 'views/menus/help_menu';
import { NotificationsMenuPopover } from 'views/menus/notifications_menu';
import { AuthModal } from 'views/modals/AuthModal';
import { FeedbackModal } from 'views/modals/feedback_modal';
import { LoginModal } from 'views/modals/login_modal';

import './SublayoutHeader.scss';

type SublayoutHeaderProps = {
  onMobile: boolean;
  isInsideCommunity: boolean;
};

export const SublayoutHeader = ({
  onMobile,
  isInsideCommunity,
}: SublayoutHeaderProps) => {
  const newSignInModalEnabled = useFlag('newSignInModal');
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const navigate = useCommonNavigate();
  const {
    menuVisible,
    setMenu,
    menuName,
    setMobileMenuName,
    mobileMenuName,
    setUserToggledVisibility,
    setRecentlyUpdatedVisibility,
  } = useSidebarStore();
  const { isLoggedIn } = useUserLoggedIn();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setRecentlyUpdatedVisibility(menuVisible);
  }, [menuVisible, setRecentlyUpdatedVisibility]);

  const handleToggle = () => {
    const isVisible = !menuVisible;
    setMenu({ name: menuName, isVisible });
    setTimeout(() => {
      setUserToggledVisibility(isVisible ? 'open' : 'closed');
    }, 200);
  };

  return (
    <>
      {onMobile ? (
        <MobileHeader
          onMobile={onMobile}
          onSignInClick={() => setIsAuthModalOpen(true)}
          isInsideCommunity={isInsideCommunity}
          menuVisible={menuVisible}
        />
      ) : (
        <div className="SublayoutHeader">
          <div className="header-left">
            <CWDivider isVertical />
            <CWIconButton
              iconName="commonLogo"
              iconButtonTheme="black"
              iconSize="xl"
              onClick={() => {
                if (app.isCustomDomain()) {
                  navigate('/', {}, null);
                } else {
                  if (isLoggedIn) {
                    setMobileMenuName(null);
                    navigate('/dashboard/for-you', {}, null);
                  } else {
                    navigate('/dashboard/global', {}, null);
                  }
                }
              }}
            />
            {isWindowSmallInclusive(window.innerWidth) && (
              <CWDivider isVertical />
            )}
            {onMobile && (
              <CWIconButton
                iconButtonTheme="black"
                iconName={menuVisible ? 'sidebarCollapse' : 'sidebarExpand'}
                onClick={handleToggle}
              />
            )}
          </div>
          <div className="searchbar">
            <CWSearchBar />
          </div>
          <div className="header-right">
            <div className="MobileMenuContainer">
              <CWIconButton
                iconName="dotsVertical"
                iconButtonTheme="black"
                onClick={() => {
                  setMenu({ name: menuName, isVisible: false });
                  setMobileMenuName(mobileMenuName ? null : 'MainMenu');
                }}
              />
            </div>
            <div
              className={clsx('DesktopMenuContainer', {
                isLoggedIn,
              })}
            >
              <CreateContentPopover />
              <CWTooltip
                content="Explore communities"
                placement="bottom"
                renderTrigger={(handleInteraction) => (
                  <CWIconButton
                    iconButtonTheme="black"
                    iconName="compassPhosphor"
                    onClick={() => navigate('/communities', {}, null)}
                    onMouseEnter={handleInteraction}
                    onMouseLeave={handleInteraction}
                  />
                )}
              />

              <HelpMenuPopover />

              {isLoggedIn && <NotificationsMenuPopover />}
            </div>
            {isLoggedIn && <UserDropdown />}
            {!isLoggedIn && (
              <CWButton
                buttonType="primary"
                buttonHeight="sm"
                label="Sign in"
                buttonWidth="wide"
                disabled={location.pathname.includes('/finishsociallogin')}
                onClick={() => setIsAuthModalOpen(true)}
              />
            )}
          </div>
        </div>
      )}
      <CWModal
        size="small"
        content={
          <FeedbackModal onModalClose={() => setIsFeedbackModalOpen(false)} />
        }
        onClose={() => setIsFeedbackModalOpen(false)}
        open={isFeedbackModalOpen}
      />
      {!newSignInModalEnabled ? (
        <CWModal
          content={
            <LoginModal onModalClose={() => setIsAuthModalOpen(false)} />
          }
          isFullScreen={isWindowMediumSmallInclusive(window.innerWidth)}
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
