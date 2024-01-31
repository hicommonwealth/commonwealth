import 'SublayoutHeader.scss';
import clsx from 'clsx';
import useUserLoggedIn from 'hooks/useUserLoggedIn';
import { useCommonNavigate } from 'navigation/helpers';
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import useSidebarStore from 'state/ui/sidebar';
import UserDropdown from 'views/components/Header/UserDropdown/UserDropdown';
import { CWTooltip } from 'views/components/component_kit/new_designs/CWTooltip';
import { HelpMenuPopover } from 'views/menus/help_menu';
import { AuthModal } from 'views/modals/AuthModal';
import { FeedbackModal } from 'views/modals/feedback_modal';
import { LoginModal } from 'views/modals/login_modal';
import { featureFlags } from '../helpers/feature-flags';
import app from '../state';
import { CWDivider } from './components/component_kit/cw_divider';
import { CWIconButton } from './components/component_kit/cw_icon_button';
import {
  isWindowMediumSmallInclusive,
  isWindowSmallInclusive,
} from './components/component_kit/helpers';
import { CWModal } from './components/component_kit/new_designs/CWModal';
import { CWSearchBar } from './components/component_kit/new_designs/CWSearchBar';
import { CWButton } from './components/component_kit/new_designs/cw_button';
import { CreateContentPopover } from './menus/create_content_menu';
import { NotificationsMenuPopover } from './menus/notifications_menu';

type SublayoutHeaderProps = {
  onMobile: boolean;
};

export const SublayoutHeader = ({ onMobile }: SublayoutHeaderProps) => {
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

  function handleToggle() {
    const isVisible = !menuVisible;
    setMenu({ name: menuName, isVisible });
    setTimeout(() => {
      setUserToggledVisibility(isVisible ? 'open' : 'closed');
    }, 200);
  }

  return (
    <>
      <div className="SublayoutHeader">
        <div
          className={`header-left ${
            app.platform() === 'desktop' ? 'desktop' : ''
          }`}
        >
          {app.platform() === 'desktop' && <CWDivider isVertical />}
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
          {(featureFlags.sidebarToggle || onMobile) && app.activeChainId() && (
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
            className={clsx('DesktopMenuContainer', 'session-keys', {
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
      <CWModal
        size="small"
        content={
          <FeedbackModal onModalClose={() => setIsFeedbackModalOpen(false)} />
        }
        onClose={() => setIsFeedbackModalOpen(false)}
        open={isFeedbackModalOpen}
      />
      {!featureFlags.newSignInModal ? (
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
