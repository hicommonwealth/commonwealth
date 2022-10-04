/* @jsx m */

import m from 'mithril';

import 'sublayout_header_right.scss';

import app from 'state';
import {
  NewProposalButton,
  MobileNewProposalButton,
} from 'views/components/new_proposal_button';
import { ChainInfo } from 'models';
import { NotificationsMenu } from 'views/components/header/notifications_menu';
import { InvitesMenu } from 'views/components/header/invites_menu';
import { LoginSelector } from 'views/components/header/login_selector';
import { isWindowMediumSmallInclusive } from './components/component_kit/helpers';
import { CWButton } from './components/component_kit/cw_button';

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
        {/* threadOnly option assumes all chains have proposals beyond threads */}
        {showNewProposalButton &&
          (isWindowMediumSmallInclusive(window.innerWidth) ? (
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
