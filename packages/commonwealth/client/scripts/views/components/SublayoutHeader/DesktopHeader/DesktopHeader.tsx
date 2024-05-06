import clsx from 'clsx';
import React from 'react';
import app from 'state';

import { WalletSsoSource } from '@hicommonwealth/shared';
import { Knock } from 'Knock';
import { useFlag } from 'hooks/useFlag';
import useUserLoggedIn from 'hooks/useUserLoggedIn';
import { useCommonNavigate } from 'navigation/helpers';
import useSidebarStore from 'state/ui/sidebar';
import { CWDivider } from 'views/components/component_kit/cw_divider';
import { CWIconButton } from 'views/components/component_kit/cw_icon_button';
import { isWindowSmallInclusive } from 'views/components/component_kit/helpers';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import { CWSearchBar } from 'views/components/component_kit/new_designs/CWSearchBar';
import { CWTooltip } from 'views/components/component_kit/new_designs/CWTooltip';
import { CreateContentPopover } from 'views/menus/create_content_menu';
import { HelpMenuPopover } from 'views/menus/help_menu';
import UserDropdown from './UserDropdown';

import { NotificationsMenuPopover } from 'views/menus/notifications_menu';
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
  const { menuVisible, setMenu, menuName, setUserToggledVisibility } =
    useSidebarStore();

  const handleToggle = () => {
    const isVisible = !menuVisible;
    setMenu({ name: menuName, isVisible });
    setTimeout(() => {
      setUserToggledVisibility(isVisible ? 'open' : 'closed');
    }, 200);
  };

  const enableKnockInAppNotifications = useFlag('knockInAppNotifications');

  return (
    <div className="DesktopHeader">
      <div className="header-left">
        <CWIconButton
          iconName="commonLogo"
          iconButtonTheme="black"
          iconSize="header"
          onClick={() => {
            if (app.isCustomDomain()) {
              navigate('/', {}, null);
            } else {
              if (isLoggedIn) {
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
        <div
          className={clsx('DesktopMenuContainerParent', {
            isLoggedIn,
          })}
        >
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

            {isLoggedIn && !enableKnockInAppNotifications && (
              <NotificationsMenuPopover />
            )}
          </div>

          {isLoggedIn && enableKnockInAppNotifications && <Knock />}
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
