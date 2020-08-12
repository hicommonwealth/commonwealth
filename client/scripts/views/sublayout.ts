import 'sublayout.scss';

import m from 'mithril';
import app from 'state';
import { Button, Icons, Grid, Col } from 'construct-ui';

import NewProposalButton from 'views/components/new_proposal_button';
import ConfirmInviteModal from 'views/modals/confirm_invite_modal';
import NotificationsMenu from 'views/components/header/notifications_menu';
import LoginSelector from 'views/components/header/login_selector';
import { CollectiveVotingButton, CandidacyButton } from './pages/council/index';
import { SubstrateAccount } from '../controllers/chain/substrate/account';

const Sublayout: m.Component<{
  class: string,
  title?: string,
  description?: string,
  showNewProposalButton?: boolean,
  showCouncilVoteButton?: boolean,
  showSubmitCandidacyButton?: boolean,
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
      showSubmitCandidacyButton,
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
      showSubmitCandidacyButton && m(CandidacyButton, { buttonStyle: true, candidates: councilCandidates }),
    ]);

    return m('.Sublayout', { class: vnode.attrs.class }, [
      m(Grid, { class: 'sublayout-grid' }, [
        rightSidebar ? [
          m(Col, { span: { xs: 12, md: 3 }, order: { xs: 1, md: 2 }, class: 'sublayout-right-sidebar' }, [
            m('.sublayout-header', [
              sublayoutHeaderRight,
            ]),
            m('.sublayout-sidebar', [
              rightSidebar,
            ]),
          ]),
          m(Col, { span: { xs: 12, md: 9 }, order: { xs: 2, md: 1 }, class: 'sublayout-grid-col sublayout-grid-col-narrow' }, [
            (title || description) && m('.sublayout-header', [
              m('.sublayout-header-left', [
                title && m('h4.sublayout-header-heading', title),
                description && m('.sublayout-header-description', description),
              ]),
            ]),
            m('.sublayout-body', [
              vnode.children,
            ]),
          ]),
        ] : [
          m(Col, { span: 12, class: 'sublayout-grid-col sublayout-grid-col-wide' }, [
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
        ],
      ]),
    ]);
  }
};

export default Sublayout;
