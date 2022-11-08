/* @jsx m */

import m from 'mithril';

import 'sublayout_header.scss';

import app from '../state';
import { CWCommunityAvatar } from './components/component_kit/cw_community_avatar';
import { CWDivider } from './components/component_kit/cw_divider';
import { CWIconButton } from './components/component_kit/cw_icon_button';
import { isWindowSmallInclusive } from './components/component_kit/helpers';
import { LoginSelector } from './components/header/login_selector';
import { SearchBar } from './components/search_bar';
import { CreateContentPopover } from './menus/create_content_menu';
import { HelpMenuPopover } from './menus/help_menu';
import { InvitesMenuPopover } from './menus/invites_menu';
import { NotificationsMenuPopover } from './menus/notifications_menu';

type SublayoutHeaderAttrs = {
  hideSearch?: boolean;
  isSidebarToggleable: boolean;
  isSidebarToggled: boolean;
  toggleSidebar: () => void;
};

export class SublayoutHeader implements m.ClassComponent<SublayoutHeaderAttrs> {
  view(vnode) {
    const { hideSearch, isSidebarToggleable, isSidebarToggled, toggleSidebar } =
      vnode.attrs;

    return (
      <div class="SublayoutHeader">
        <div class="header-left">
          <CWIconButton
            iconName="commonLogo"
            iconButtonTheme="black"
            iconSize="xl"
            onclick={() => {
              if (app.isCustomDomain()) {
                m.route.set('/');
              } else {
                m.route.set('/dashboard/for-you');
              }
            }}
          />
          {isWindowSmallInclusive(window.innerWidth) && (
            <CWDivider isVertical />
          )}
          {!isSidebarToggled && app.activeChainId() && (
            <CWCommunityAvatar size="large" community={app.chain.meta} />
          )}
          {isSidebarToggleable && (
            <CWIconButton
              iconButtonTheme="black"
              iconName={isSidebarToggled ? 'sidebarCollapse' : 'sidebarExpand'}
              onclick={() => {
                toggleSidebar();
                localStorage.setItem(
                  `${app.activeChainId()}-sidebar-toggle`,
                  (!isSidebarToggled).toString()
                );
                m.redraw();
              }}
            />
          )}
        </div>
        {!hideSearch && <SearchBar />}
        <div class="header-right">
          <div class="MobileMenuContainer">
            <CWIconButton
              iconName="dotsVertical"
              iconButtonTheme="black"
              onclick={() => {
                app.mobileMenu = app.mobileMenu ? null : 'MainMenu';
              }}
            />
          </div>
          <div class="DesktopMenuContainer">
            <CreateContentPopover />
            <HelpMenuPopover />
            {app.isLoggedIn() && <NotificationsMenuPopover />}
            {app.isLoggedIn() && app.config.invites?.length > 0 && (
              <InvitesMenuPopover />
            )}
          </div>
          <LoginSelector />
        </div>
      </div>
    );
  }
}
