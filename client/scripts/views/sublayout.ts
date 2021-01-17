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
import { ChainIcon, CommunityIcon } from 'views/components/chain_icon';

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
  showNewProposalButton?: boolean,
  showCouncilMenu?: boolean,
  hideSidebar?: boolean,
}> = {
  view: (vnode) => {
    const {
      title,
      description,
      showNewProposalButton,
      showCouncilMenu,
      hideSidebar,
    } = vnode.attrs;
    const chain = app.chain ? app.chain.meta.chain : null;
    const community = app.community ? app.community.meta : null;

    let councilCandidates: Array<[SubstrateAccount, number]>;
    if (app.chain && showCouncilMenu) {
      councilCandidates = getCouncilCandidates();
    }

    const ICON_SIZE = 22;
    const sublayoutHeaderLeft = m('.sublayout-header-left', [
      chain ? [
        m(ChainIcon, { size: ICON_SIZE, chain }),
        m('h4.sublayout-header-heading', [
          chain.name,
          title && ' / ',
          title
        ]),
      ] : community ? [
        m(CommunityIcon, { size: ICON_SIZE, community }),
        m('h4.sublayout-header-heading', [
          community.name,
          community.privacyEnabled && m('span.icon-lock'),
          title && ' / ',
          title
        ]),
      ] : '',
    ]);

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
            sublayoutHeaderLeft,
            sublayoutHeaderRight,
          ]),
          m('.sublayout-body', [
            m('.sublayout-grid', [
              !hideSidebar && m('.sublayout-sidebar-col', [
                m(Sidebar),
              ]),
              m('.sublayout-main-col', [
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
