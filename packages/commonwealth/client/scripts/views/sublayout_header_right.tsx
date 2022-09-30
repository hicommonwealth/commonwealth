/* @jsx m */

import m from 'mithril';

import 'sublayout_header_right.scss';

import app from 'state';
import { ChainInfo } from 'models';
import { NotificationsMenu } from 'views/components/header/notifications_menu';
import { InvitesMenu } from 'views/components/header/invites_menu';
import { LoginSelector } from 'views/components/header/login_selector';
import { CreateContentPopover } from './popovers/create_content_popover';
import { HelpMenu } from './menus/help_menu';
import { CWPopoverMenu } from './components/component_kit/cw_popover/cw_popover_menu';
import { CWMenuItem } from './components/component_kit/cw_menu_item';
import { CWIconButton } from './components/component_kit/cw_icon_button';

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
          <CWPopoverMenu
            trigger={
              <CWIconButton iconButtonTheme="black" iconName="dotsVertical" />
            }
            MenuItems={
              <>
                {showCreateContentMenuTrigger && (
                  <CWMenuItem iconName="plusCircle" label="Create" />
                  // <CreateContentPopover fluid={false} threadOnly={!chain} />
                )}
                <HelpMenu />
                {app.isLoggedIn() && <NotificationsMenu />}
                {app.isLoggedIn() && <InvitesMenu />}
              </>
            }
          />
        </div>
        {/* threadOnly option assumes all chains have proposals beyond threads */}
        <div class="DesktopIconWrap">
          {showCreateContentMenuTrigger && (
            <CreateContentPopover fluid={false} threadOnly={!chain} />
          )}
          <HelpMenu />
          {app.isLoggedIn() && <NotificationsMenu />}
          {app.isLoggedIn() && <InvitesMenu />}
        </div>
        <LoginSelector />
      </div>
    );
  }
}
