import React from 'react';

import 'sublayout_header.scss';

import app from '../state';
import { CWCommunityAvatar } from './components/component_kit/cw_community_avatar';
import { CWDivider } from './components/component_kit/cw_divider';
import { CWIconButton } from './components/component_kit/cw_icon_button';
import { isWindowSmallInclusive } from './components/component_kit/helpers';
import { LoginSelector } from './components/header/login_selector';
import { CreateContentPopover } from './menus/create_content_menu';
import { NotificationsMenuPopover } from './menus/notifications_menu';
import { SearchBar } from './pages/search/search_bar';
import { useCommonNavigate } from 'navigation/helpers';
import { HelpMenuPopover } from 'views/menus/help_menu';
import useUserLoggedIn from 'hooks/useUserLoggedIn';
import useSidebarStore from 'stores/zustand/sidebar';

type SublayoutHeaderProps = {
  hideSearch?: boolean;
  onMobile: boolean;
};

export const SublayoutHeader = ({
  hideSearch,
  onMobile,
}: SublayoutHeaderProps) => {
  const navigate = useCommonNavigate();
  const { isLoggedIn } = useUserLoggedIn();
  const [sidebarToggled, toggleSidebar] = useSidebarStore((s) => [
    s.toggled,
    s.toggle,
  ]);

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
        {(!isWindowSmallInclusive(window.innerWidth) || !sidebarToggled) && app.activeChainId() && (
          <CWCommunityAvatar
            size="large"
            community={app.chain.meta}
            onClick={() => { navigate('/discussions'); }}
          />
        )}
        {onMobile && app.activeChainId() && (
          <CWIconButton
            iconButtonTheme="black"
            iconName={sidebarToggled ? 'sidebarCollapse' : 'sidebarExpand'}
            onClick={() => {
              toggleSidebar(!sidebarToggled);
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
              toggleSidebar(false);
              app.mobileMenu = app.mobileMenu ? null : 'MainMenu';
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
