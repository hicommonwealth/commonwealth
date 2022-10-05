/* @jsx m */

import m from 'mithril';

import 'sublayout_header_right.scss';

import app from 'state';
import { ChainInfo } from 'models';
import { InvitesMenuPopover } from 'views/popovers/invites_menu_popover';
import { LoginSelector } from 'views/components/header/login_selector';
import { NotificationsMenuPopover } from './popovers/notifications_menu_popover';
import { CreateContentPopover } from './popovers/create_content_popover';
import { CWIconButton } from './components/component_kit/cw_icon_button';
import { HelpMenuPopover } from './popovers/help_menu_popover';

type SublayoutHeaderRightAttrs = {
  chain: ChainInfo;
  showCreateContentMenuTrigger?: boolean;
};

export class SublayoutHeaderRight
  implements m.ClassComponent<SublayoutHeaderRightAttrs>
{
  view(vnode) {
    const { chain, showCreateContentMenuTrigger } = vnode.attrs;
    return (
      <div class="SublayoutHeaderRight">
        {/* Only visible in mobile browser widths */}
        <div class="MobileIconPopover">
          <CWIconButton
            iconTheme="black"
            iconName="dotsVertical"
            onclick={(e) => {
              if (app.mobileMenu === 'main') {
                delete app.mobileMenu;
              } else {
                app.mobileMenu = 'main';
              }
            }}
          />
        </div>
        {/* threadOnly option assumes all chains have proposals beyond threads */}
        <div class="DesktopIconWrap">
          {showCreateContentMenuTrigger && (
            <CreateContentPopover fluid={false} threadOnly={!chain} />
          )}
          <HelpMenuPopover />
          {app.isLoggedIn() && <NotificationsMenuPopover />}
          {app.isLoggedIn() && <InvitesMenuPopover />}
        </div>
        <LoginSelector />
      </div>
    );
  }
}
