import React from 'react';

import { ClassComponent, setRoute, redraw } from 'mithrilInterop';
import type { ResultNode } from 'mithrilInterop';

import 'sublayout_header.scss';

import app from '../state';
import { CWCommunityAvatar } from './components/component_kit/cw_community_avatar';
import { CWDivider } from './components/component_kit/cw_divider';
import { CWIconButton } from './components/component_kit/cw_icon_button';
import { isWindowSmallInclusive } from './components/component_kit/helpers';
import { LoginSelector } from './components/header/login_selector';
import { CreateContentPopover } from './menus/create_content_menu';
import { HelpMenuPopover } from './menus/help_menu';
import { NotificationsMenuPopover } from './menus/notifications_menu';
import { SearchBar } from './pages/search/search_bar';

type SublayoutHeaderAttrs = {
  hideSearch?: boolean;
  onMobile: boolean;
};

export class SublayoutHeader extends ClassComponent<SublayoutHeaderAttrs> {
  view(vnode: ResultNode<SublayoutHeaderAttrs>) {
    const { hideSearch, onMobile } = vnode.attrs;

    return (
      <div className="SublayoutHeader">
        <div className="header-left">
          <CWIconButton
            iconName="commonLogo"
            iconButtonTheme="black"
            iconSize="xl"
            onClick={() => {
              if (app.isCustomDomain()) {
                setRoute('/');
              } else {
                setRoute('/dashboard/for-you');
              }
            }}
          />
          {isWindowSmallInclusive(window.innerWidth) && (
            <CWDivider isVertical />
          )}
          {!app.sidebarToggled && app.activeChainId() && (
            <CWCommunityAvatar size="large" community={app.chain.meta} />
          )}
          {onMobile && app.activeChainId() && (
            <CWIconButton
              iconButtonTheme="black"
              iconName={
                app.sidebarToggled ? 'sidebarCollapse' : 'sidebarExpand'
              }
              onClick={() => {
                app.sidebarToggled = !app.sidebarToggled;
                redraw();
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
                app.sidebarToggled = false;
                app.mobileMenu = app.mobileMenu ? null : 'MainMenu';
                app.mobileMenuRedraw.emit('redraw');
              }}
            />
          </div>
          <div className="DesktopMenuContainer">
            <CreateContentPopover />
            <HelpMenuPopover />
            {app.isLoggedIn() && <NotificationsMenuPopover />}
          </div>
          <LoginSelector />
        </div>
      </div>
    );
  }
}
