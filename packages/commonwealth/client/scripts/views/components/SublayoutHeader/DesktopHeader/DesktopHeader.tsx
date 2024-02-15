import clsx from 'clsx';
import React from 'react';
import app from 'state';

import UserDropdown from 'views/components/SublayoutHeader/UserDropdown';
import { CWDivider } from 'views/components/component_kit/cw_divider';
import { CWIconButton } from 'views/components/component_kit/cw_icon_button';
import { isWindowSmallInclusive } from 'views/components/component_kit/helpers';
import { CWSearchBar } from 'views/components/component_kit/new_designs/CWSearchBar';
import { CWTooltip } from 'views/components/component_kit/new_designs/CWTooltip';
import { CWButton } from 'views/components/component_kit/new_designs/cw_button';
import { CreateContentPopover } from 'views/menus/create_content_menu';
import { HelpMenuPopover } from 'views/menus/help_menu';
import { NotificationsMenuPopover } from 'views/menus/notifications_menu';

import { WalletSsoSource } from '@hicommonwealth/core';
import useUserLoggedIn from 'hooks/useUserLoggedIn';
import { useCommonNavigate } from 'navigation/helpers';
import useSidebarStore from 'state/ui/sidebar';
import './DesktopHeader.scss';

interface DesktopHeaderProps {
  onMobile: boolean;
  onAuthModalOpen: () => void;
  onRevalidationModalData: ({
    walletSsoSource,
    walletAddress,
  }: {
    walletSsoSource: WalletSsoSource;
    walletAddress: string;
  }) => void;
  onFeedbackModalOpen: (open: boolean) => void;
}

const DesktopHeader = ({
  onMobile,
  onAuthModalOpen,
  onRevalidationModalData,
  onFeedbackModalOpen,
}: DesktopHeaderProps) => {
  const navigate = useCommonNavigate();
  const { isLoggedIn } = useUserLoggedIn();
  const {
    menuVisible,
    setMenu,
    menuName,
    setMobileMenuName,
    mobileMenuName,
    setUserToggledVisibility,
  } = useSidebarStore();

  const handleToggle = () => {
    const isVisible = !menuVisible;
    setMenu({ name: menuName, isVisible });
    setTimeout(() => {
      setUserToggledVisibility(isVisible ? 'open' : 'closed');
    }, 200);
  };

  return (
    <div className="DesktopHeader">
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
        {isWindowSmallInclusive(window.innerWidth) && <CWDivider isVertical />}
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

          <HelpMenuPopover onFeedbackModalOpen={onFeedbackModalOpen} />

          {isLoggedIn && <NotificationsMenuPopover />}
        </div>

        {isLoggedIn && (
          <UserDropdown
            onAuthModalOpen={onAuthModalOpen}
            onRevalidationModalData={onRevalidationModalData}
          />
        )}

        {!isLoggedIn && (
          <CWButton
            buttonType="primary"
            buttonHeight="sm"
            label="Sign in"
            buttonWidth="wide"
            disabled={location.pathname.includes('/finishsociallogin')}
            onClick={onAuthModalOpen}
          />
        )}
      </div>
    </div>
  );
};

export default DesktopHeader;
