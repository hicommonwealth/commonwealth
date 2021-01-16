import 'sublayout.scss';

import m, { Vnode } from 'mithril';
import app from 'state';
import { EmptyState, Button, Icons, Grid, Col, Spinner } from 'construct-ui';

import NewProposalButton from 'views/components/new_proposal_button';
import ConfirmInviteModal from 'views/modals/confirm_invite_modal';
import NotificationsMenu from 'views/components/header/notifications_menu';
import LoginSelector from 'views/components/header/login_selector';
import Sidebar from 'views/components/sidebar';
import { getCouncilCandidates } from 'views/pages/council/index';
import CommunitySelector, { CommunityLabel } from 'views/components/sidebar/community_selector';

import { SubstrateAccount } from 'controllers/chain/substrate/account';
import Substrate from 'controllers/chain/substrate/main';

const Sublayout: m.Component<{
  // overrides
  loadingLayout?: boolean,
  errorLayout?,

  // content
  class?: string,
  title?: any,                        // displayed at the top of the layout
  description?: string,               // displayed at the top of the layout
  sidebarTopic?: number,              // used to override the sidebar
  showNewProposalButton?: boolean,
  showCouncilMenu?: boolean,
  hideSidebar?: boolean,
}> = {
  view: (vnode) => {
    const {
      title,
      description,
      sidebarTopic,
      showNewProposalButton,
      showCouncilMenu,
      hideSidebar,
    } = vnode.attrs;

    let councilCandidates: Array<[SubstrateAccount, number]>;
    if (app.chain && showCouncilMenu) {
      councilCandidates = getCouncilCandidates();
    }

    const sublayoutHeaderRight = m('.sublayout-header-right', [
      m(LoginSelector),                                                 // login selector
      app.isLoggedIn() && app.config.invites?.length > 0 && m(Button, { // invites menu
        class: 'InvitesButton',
        iconLeft: Icons.MAIL,
        onclick: () => app.modals.create({ modal: ConfirmInviteModal }),
      }),
      app.isLoggedIn() && m(NotificationsMenu),                         // notifications menu
      showNewProposalButton && m(NewProposalButton, { fluid: false, councilCandidates }),
    ]);

    if (vnode.attrs.loadingLayout) return [
      m('.layout-container', [
        m('.LoadingLayout', [
          m(Spinner, { active: true, fill: true, size: 'xl' }),
        ]),
      ]),
    ];

    if (vnode.attrs.errorLayout) return [
      m('.layout-container', [
        m(EmptyState, {
          fill: true,
          icon: Icons.ALERT_TRIANGLE,
          content: vnode.attrs.errorLayout,
          style: 'color: #546e7b;'
        }),
      ]),
    ];

    return [
      m('.layout-container', [
        m('.Sublayout', { class: vnode.attrs.class }, [
          m('.sublayout-header', { class: !title ? 'no-title' : '' }, [
            m('.sublayout-header-left', [
              (app.chain || app.community) && m(CommunitySelector),
              title && m('h4.sublayout-header-heading', title),
            ]),
            sublayoutHeaderRight,
          ]),
          m('.sublayout-body', [
            m(Grid, { class: 'sublayout-grid' }, [
              m(Col, { span: 3, style: 'padding-right: 30px' }, [
                !hideSidebar && m(Sidebar, { sidebarTopic }),
              ]),
              m(Col, { span: 9 }, [
                vnode.children
              ]),
            ]),
          ]),
        ]),
      ]),
    ];
  }
};

export default Sublayout;
