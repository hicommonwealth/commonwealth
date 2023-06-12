import useUserLoggedIn from 'hooks/useUserLoggedIn';
import { useCommonNavigate } from 'navigation/helpers';
import React from 'react';
import useSidebarStore from 'state/ui/sidebar';
import 'SublayoutHeader.scss';
import { HelpMenuPopover } from 'views/menus/help_menu';
import app from '../state';
import { CWCommunityAvatar } from './components/component_kit/cw_community_avatar';
import { CWDivider } from './components/component_kit/cw_divider';
import { CWIconButton } from './components/component_kit/cw_icon_button';
import { isWindowSmallInclusive } from './components/component_kit/helpers';
import { LoginSelector } from './components/Header/LoginSelector';
import { CreateContentPopover } from './menus/create_content_menu';
import { NotificationsMenuPopover } from './menus/notifications_menu';
import { SearchBar } from './pages/search/search_bar';

type SublayoutHeaderProps = {
  hideSearch?: boolean;
  onMobile: boolean;
  isLoadingProfileData?: boolean;
};

export const SublayoutHeader = ({
  hideSearch,
  onMobile,
  isLoadingProfileData = false,
}: SublayoutHeaderProps) => {
  const navigate = useCommonNavigate();
  const { menuVisible, setMenu, menuName, setMobileMenuName, mobileMenuName } =
    useSidebarStore();
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
        {onMobile && app.activeChainId() && (
          <CWIconButton
            iconButtonTheme="black"
            iconName={menuVisible ? 'sidebarCollapse' : 'sidebarExpand'}
            onClick={() => {
              setMenu({ name: menuName, isVisible: !menuVisible });
            }}
          />
        )}
      </div>
      {!hideSearch && <SearchBar />}
      <div className="header-right">
        {isLoadingProfileData ? (
          <></>
        ) : (
          <>
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
          </>
        )}
      </div>
    </div>
  );
};
