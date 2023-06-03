import React from 'react';

import 'SublayoutHeader.scss';

import app from '../state';
import { CWCommunityAvatar } from './components/component_kit/cw_community_avatar';
import { CWDivider } from './components/component_kit/cw_divider';
import { CWIconButton } from './components/component_kit/cw_icon_button';
import { isWindowSmallInclusive } from './components/component_kit/helpers';
import { LoginSelector } from './components/Header/LoginSelector';
import { CreateContentPopover } from './menus/create_content_menu';
import { NotificationsMenuPopover } from './menus/notifications_menu';
import { SearchBar } from './pages/search/search_bar';
import { useCommonNavigate } from 'navigation/helpers';
import { HelpMenuPopover } from 'views/menus/help_menu';
import useUserLoggedIn from 'hooks/useUserLoggedIn';
import useSidebarStore from 'state/ui/sidebar';

type SublayoutHeaderProps = {
  hideSearch?: boolean;
  onMobile: boolean;
};

export const SublayoutHeader = ({
  hideSearch,
  onMobile,
}: SublayoutHeaderProps) => {
  const navigate = useCommonNavigate();
  const {
    menuVisible,
    setMenu,
    menuName,
    setMobileMenuName,
    mobileMenuName,
    setUserToggledVisibility,
  } = useSidebarStore();
  const { isLoggedIn } = useUserLoggedIn();

  return (
    <div className="SublayoutHeader">
      <div className="header-left">
        <CWIconButton
          iconName="commonLogo"
          iconButtonTheme="black"
          iconSize="xl"
          onClick={() => {
            if (app.isCustomDomain()) {
              navigate('/', {}, null);
            } else {
              navigate('/dashboard/for-you', {}, null);
            }
          }}
        />
        {isWindowSmallInclusive(window.innerWidth) && <CWDivider isVertical />}
        {(!isWindowSmallInclusive(window.innerWidth) || !menuVisible) &&
          app.activeChainId() && (
            <CWCommunityAvatar
              size="large"
              community={app.chain.meta}
              onClick={() => {
                navigate('/discussions');
              }}
            />
          )}
        {app.activeChainId() && (
          <CWIconButton
            iconButtonTheme="black"
            iconName={menuVisible ? 'sidebarCollapse' : 'sidebarExpand'}
            onClick={() => {
              setMenu({ name: menuName, isVisible: !menuVisible });
              setUserToggledVisibility(!menuVisible ? 'closed' : 'open');
            }}
          />
        )}
      </div>
      {!hideSearch && <SearchBar />}
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
        <div className="DesktopMenuContainer">
          <CreateContentPopover />
          <HelpMenuPopover />
          {isLoggedIn && !onMobile && <NotificationsMenuPopover />}
        </div>
        <LoginSelector />
      </div>
    </div>
  );
};
