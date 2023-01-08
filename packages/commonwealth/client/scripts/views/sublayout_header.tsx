/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';

import 'sublayout_header.scss';

import app from '../state';
import navState from '../navigationState';
import chainState from '../chainState';
import { CWCommunityAvatar } from './components/component_kit/cw_community_avatar';
import { CWDivider } from './components/component_kit/cw_divider';
import { CWIconButton } from './components/component_kit/cw_icon_button';
import { isWindowSmallInclusive } from './components/component_kit/helpers';
import { LoginSelector } from './components/header/login_selector';
import { CreateContentPopover } from './menus/create_content_menu';
import { HelpMenuPopover } from './menus/help_menu';
import { InvitesMenuPopover } from './menus/invites_menu';
import { NotificationsMenuPopover } from './menus/notifications_menu';
import { SearchBar } from './pages/search/search_bar';

type SublayoutHeaderAttrs = {
  hideSearch?: boolean;
  onMobile: boolean;
};

export class SublayoutHeader extends ClassComponent<SublayoutHeaderAttrs> {
  view(vnode: m.Vnode<SublayoutHeaderAttrs>) {
    const { hideSearch, onMobile } = vnode.attrs;

    return (
      <div class="SublayoutHeader">
        <div class="header-left">
          <CWIconButton
            iconName="commonLogo"
            iconButtonTheme="black"
            iconSize="xl"
            onclick={() => {
              if (navState.isCustomDomain()) {
                m.route.set('/');
              } else {
                m.route.set('/dashboard/for-you');
              }
            }}
          />
          {isWindowSmallInclusive(window.innerWidth) && (
            <CWDivider isVertical />
          )}
          {!navState.sidebarToggled && navState.activeChainId() && (
            <CWCommunityAvatar size="large" community={chainState.chain.meta} />
          )}
          {onMobile && navState.activeChainId() && (
            <CWIconButton
              iconButtonTheme="black"
              iconName={
                navState.sidebarToggled ? 'sidebarCollapse' : 'sidebarExpand'
              }
              onclick={() => {
                navState.sidebarToggled = !navState.sidebarToggled;
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
                navState.sidebarToggled = false;
                navState.mobileMenu = navState.mobileMenu ? null : 'MainMenu';
                m.redraw();
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
