/* @jsx m */

import m from 'mithril';

import 'sublayout_header_right.scss';

import app from 'state';
import { NewProposalButton } from 'views/components/new_proposal_button';
import { ChainInfo } from 'models';
import { NotificationsMenu } from 'views/components/header/notifications_menu';
import { InvitesMenu } from 'views/components/header/invites_menu';
import { LoginSelector } from 'views/components/header/login_selector';
import {
  isWindowExtraSmall,
  isWindowMediumSmallInclusive,
} from './components/component_kit/helpers';
import { HelpMenu } from './components/header/help_menu';
import {
  CWPopoverMenu,
  CWPopoverMenuItem,
} from './components/component_kit/cw_popover/cw_popover_menu';
import { CWIconButton } from './components/component_kit/cw_icon_button';

type SublayoutHeaderRightAttrs = {
  chain: ChainInfo;
  showNewProposalButton?: boolean;
};

export class SublayoutHeaderRight
  implements m.ClassComponent<SublayoutHeaderRightAttrs>
{
  view(vnode) {
    const { chain, showNewProposalButton } = vnode.attrs;
    return (
      <div class="SublayoutHeaderRight">
        {/* Only visible in mobile browser widths */}
        <div class="MobileIconPopover">
          <CWPopoverMenu
            trigger={
              <CWIconButton iconButtonTheme="black" iconName="dotsVertical" />
            }
            popoverMenuItems={
              <>
                {showNewProposalButton && (
                  <CWPopoverMenuItem iconName="plusCircle" label="Create" />
                  // <NewProposalButton fluid={false} threadOnly={!chain} />
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
          {showNewProposalButton && (
            <NewProposalButton fluid={false} threadOnly={!chain} />
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
