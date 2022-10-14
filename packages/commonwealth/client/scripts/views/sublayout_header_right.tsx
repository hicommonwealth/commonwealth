/* @jsx m */

import m from 'mithril';

import 'sublayout_header_right.scss';

import app from 'state';
import { LoginSelector } from 'views/components/header/login_selector';
import { CWIconButton } from './components/component_kit/cw_icon_button';
import { CreateContentPopover } from './menus/create_content_menu';
import { HelpMenuPopover } from './menus/help_menu';
import { InvitesMenuPopover } from './menus/invites_menu';
import { NotificationsMenuPopover } from './menus/notifications_menu';

export class SublayoutHeaderRight implements m.ClassComponent {
  view() {
    return (
      <div class="SublayoutHeaderRight">
        {/* Only visible in mobile browser widths */}
        <div class="MobileMenuContainer">
          <CWIconButton
            iconName="dotsVertical"
            iconButtonTheme="black"
            onclick={() => {
              app.mobileMenu = app.mobileMenu ? null : 'MainMenu';
            }}
          />
        </div>
        {/* threadOnly option assumes all chains have proposals beyond threads */}
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
    );
  }
}
