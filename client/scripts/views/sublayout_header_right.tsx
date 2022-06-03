/* @jsx m */

import m from 'mithril';

import 'sublayout_header_right.scss';

import app from 'state';
import {
  NewProposalButton,
  MobileNewProposalButton,
} from 'views/components/new_proposal_button';
import { ChainInfo } from 'client/scripts/models';
import { NotificationsMenu } from 'views/components/header/notifications_menu';
import { InvitesMenu } from 'views/components/header/invites_menu';
import { LoginSelector } from 'views/components/header/login_selector';
import { CWGradientButton } from './components/component_kit/cw_gradient_button';

type SublayoutHeaderRightAttrs = {
  chain: ChainInfo;
  showNewProposalButton?: boolean;
};

export class SublayoutHeaderRight
  implements m.ClassComponent<SublayoutHeaderRightAttrs>
{
  view(vnode) {
    const { chain, showNewProposalButton } = vnode.attrs;

    const narrowBrowserWidth =
      window.innerWidth > 767.98 && window.innerWidth < 850;

    return (
      <div class="SublayoutHeaderRight">
        {/* threadOnly option assumes all chains have proposals beyond threads */}
        {showNewProposalButton &&
          (narrowBrowserWidth ? (
            <MobileNewProposalButton />
          ) : (
            <NewProposalButton fluid={false} threadOnly={!chain} />
          ))}
        {app.isLoggedIn() && <NotificationsMenu />}
        {app.isLoggedIn() && <InvitesMenu />}
        <InvitesMenu />
        <LoginSelector />
      </div>
    );
  }
}
