/* @jsx m */

import m from 'mithril';

import 'sublayout_header_right.scss';

import app from 'state';
import { ChainInfo } from 'models';
import { InvitesMenuPopover } from 'views/popovers/invites_menu_popover';
import { LoginSelector } from 'views/components/header/login_selector';
import { NotificationsMenuPopover } from './popovers/notifications_menu_popover';
import { CreateContentPopover } from './popovers/create_content_menu_popover';
import { CWIconButton } from './components/component_kit/cw_icon_button';
import { HelpMenuPopover } from './popovers/help_menu_popover';
import { CWIcon } from './components/component_kit/cw_icons/cw_icon';

type SublayoutHeaderRightAttrs = {
  chain: ChainInfo;
};

export class SublayoutHeaderRight
  implements m.ClassComponent<SublayoutHeaderRightAttrs>
{
  view(vnode) {
    const { chain } = vnode.attrs;
    return (
      <div class="SublayoutHeaderRight">
        {/* Only visible in mobile browser widths */}
        <div class="MobileIconPopover">
          <CWIcon
            iconName="dotsVertical"
            onclick={(e) => {
              app.mobileMenu = app.mobileMenu ? null : 'MainMenu';
            }}
          />
        </div>
        {/* threadOnly option assumes all chains have proposals beyond threads */}
        <div class="DesktopIconWrap">
          <CreateContentPopover fluid={false} threadOnly={!chain} />
          <HelpMenuPopover />
          {app.isLoggedIn() && <NotificationsMenuPopover />}
          {app.isLoggedIn() && <InvitesMenuPopover />}
        </div>
        <LoginSelector />
      </div>
    );
  }
}
