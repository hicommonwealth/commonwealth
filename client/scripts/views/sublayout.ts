import 'sublayout.scss';

import m from 'mithril';
import app from 'state';
import { EmptyState, Button, Icons, Grid, Col } from 'construct-ui';

import NewProposalButton from 'views/components/new_proposal_button';
import ConfirmInviteModal from 'views/modals/confirm_invite_modal';
import NotificationsMenu from 'views/components/header/notifications_menu';
import LoginSelector from 'views/components/header/login_selector';
import { CollectiveVotingButton, CandidacyButton } from './pages/council/index';
import { SubstrateAccount } from '../controllers/chain/substrate/account';

import PageNotFound from 'views/pages/404';
import Sidebar from 'views/components/sidebar';
import RightSidebar from 'views/components/right_sidebar';

const Sublayout: m.Component<{
  // overrides
  loadingLayout?: boolean,
  pageNotFoundLayout?: boolean,
  errorLayout?,

  // content
  class?: string,
  title?: string,
  description?: string,
  showNewProposalButton?: boolean,
  showCouncilVoteButton?: boolean,
  showCandidacyButton?: boolean,
  councilCandidates?: Array<[SubstrateAccount, number]>,
  rightSidebar?
}> = {
  view: (vnode) => {
    const {
      title,
      description,
      rightSidebar,
      showNewProposalButton,
      showCouncilVoteButton,
      showCandidacyButton,
      councilCandidates
    } = vnode.attrs;

    const sublayoutHeaderRight = m('.sublayout-header-right', [
      m(LoginSelector),                                                 // login selector
      app.isLoggedIn() && app.config.invites?.length > 0 && m(Button, { // invites menu
        class: 'InvitesButton',
        iconLeft: Icons.MAIL,
        onclick: () => app.modals.create({ modal: ConfirmInviteModal }),
      }),
      app.isLoggedIn() && m(NotificationsMenu),                         // notifications menu
      showNewProposalButton && m(NewProposalButton, { fluid: false }),
      showCouncilVoteButton && m(CollectiveVotingButton, { buttonStyle: true, candidates: councilCandidates }),
      showCandidacyButton && m(CandidacyButton, { buttonStyle: true, candidates: councilCandidates }),
    ]);

    if (vnode.attrs.loadingLayout) return [
      m(Sidebar),
      m('.layout-container', [
        m('.LoadingLayout'),
      ]),
      m(RightSidebar, { rightSidebar }),
    ];

    if (vnode.attrs.errorLayout) return [
      m(Sidebar),
      m('.layout-container', [
        m(EmptyState, {
          fill: true,
          icon: Icons.ALERT_TRIANGLE,
          content: vnode.attrs.errorLayout,
          style: 'color: #546e7b;'
        }),
      ]),
      m(RightSidebar, { rightSidebar }),
    ];

    if (vnode.attrs.pageNotFoundLayout) return [
      m(Sidebar),
      m('.layout-container', [
        m(PageNotFound)
      ]),
      m(RightSidebar, { rightSidebar }),
    ];

    return [
      m(Sidebar),
      m('.layout-container', [
        m('.Sublayout', { class: vnode.attrs.class }, [
          m(Grid, { class: 'sublayout-grid' }, [
            m(Col, {
              span: 12,
              class: 'sublayout-grid-col sublayout-grid-col-wide'
            }, [
              m('.sublayout-header', [
                m('.sublayout-header-left', [
                  title && m('h4.sublayout-header-heading', title),
                  description && m('.sublayout-header-description', description),
                ]),
                sublayoutHeaderRight,
              ]),
              m('.sublayout-body', [
                vnode.children,
              ]),
            ]),
          ]),
        ]),
      ]),
      m(RightSidebar, { rightSidebar }),
    ];
  }
};

export default Sublayout;
