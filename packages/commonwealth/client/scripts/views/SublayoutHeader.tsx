import 'SublayoutHeader.scss';
import clsx from 'clsx';
import useUserLoggedIn from 'hooks/useUserLoggedIn';
import { useCommonNavigate } from 'navigation/helpers';
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import useSidebarStore from 'state/ui/sidebar';
import UserDropdown from 'views/components/Header/UserDropdown/UserDropdown';
import { CWTooltip } from 'views/components/component_kit/new_designs/CWTooltip';
import CollapsableSidebarButton from 'views/components/sidebar/CollapsableSidebarButton';
import { User } from 'views/components/user/user';
import { HelpMenuPopover } from 'views/menus/help_menu';
import { FeedbackModal } from 'views/modals/feedback_modal';
import { LoginModal } from 'views/modals/login_modal';
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
  isInsideCommunity: boolean;
};

export const SublayoutHeader = ({
  onMobile,
  isInsideCommunity,
}: SublayoutHeaderProps) => {
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
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setRecentlyUpdatedVisibility(menuVisible);
  }, [menuVisible, setRecentlyUpdatedVisibility]);

  const user = app.user.addresses[0];

  function handleToggle() {
    const isVisible = !menuVisible;
    setMenu({ name: menuName, isVisible });
    setTimeout(() => {
      setUserToggledVisibility(isVisible ? 'open' : 'closed');
    }, 200);
  }

  // TODO this will be handled in next ticket
  const magnifyingGlassVisible = false;
  const newUserIcon = false;

  if (onMobile) {
    const shouldShow = isInsideCommunity ? !menuVisible : true;

    return (
      <div className="MobileHeader">
        {shouldShow && (
          <CollapsableSidebarButton
            onMobile={onMobile}
            isInsideCommunity={isInsideCommunity}
          />
        )}

        <div className="right-side">
          {magnifyingGlassVisible && (
            <CWIconButton
              iconName="magnifyingGlass"
              iconButtonTheme="neutral"
            />
          )}

          {isLoggedIn ? (
            newUserIcon ? (
              <User
                shouldShowAvatarOnly
                avatarSize={24}
                userAddress={user?.address}
                userCommunityId={user?.community?.id}
              />
            ) : (
              <UserDropdown />
            )
          ) : (
            <CWButton
              label="Sign in"
              buttonHeight="sm"
              disabled={location.pathname.includes('/finishsociallogin')}
              onClick={() => setIsLoginModalOpen(true)}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <>
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
              onClick={() => setIsLoginModalOpen(true)}
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
      <CWModal
        content={<LoginModal onModalClose={() => setIsLoginModalOpen(false)} />}
        isFullScreen={isWindowMediumSmallInclusive(window.innerWidth)}
        onClose={() => setIsLoginModalOpen(false)}
        open={isLoginModalOpen}
      />
    </>
  );
};
