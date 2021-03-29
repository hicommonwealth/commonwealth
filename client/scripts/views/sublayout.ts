import 'sublayout.scss';

import m, { Vnode } from 'mithril';
import app from 'state';
import { EmptyState, Button, Icon, Icons, Grid, Col, Spinner } from 'construct-ui';
import { link } from 'helpers';

import NewProposalButton from 'views/components/new_proposal_button';
import ConfirmInviteModal from 'views/modals/confirm_invite_modal';
import NotificationsMenu from 'views/components/header/notifications_menu';
import LoginSelector from 'views/components/header/login_selector';
import Sidebar from 'views/components/sidebar';
import MobileSidebarHeader from 'views/components/sidebar/mobile';
import { ChainIcon, CommunityIcon } from 'views/components/chain_icon';
import Token from 'controllers/chain/ethereum/token/adapter';

import SearchBar from './components/search_bar';

const Sublayout: m.Component<{
  // overrides
  loadingLayout?: boolean,
  errorLayout?,

  // content
  class?: string,
  title?: any,                        // displayed at the top of the layout
  description?: string,               // displayed at the top of the layout
  hero?: any,
  showNewProposalButton?: boolean,
  showCouncilMenu?: boolean,
  hideSidebar?: boolean,
  alwaysShowTitle?: boolean,          // show page title even if app.chain and app.community are unavailable
}> = {
  view: (vnode) => {
    const {
      title,
      description,
      hero,
      showNewProposalButton,
      showCouncilMenu,
      hideSidebar,
      alwaysShowTitle,
    } = vnode.attrs;
    const chain = app.chain ? app.chain.meta.chain : null;
    const community = app.community ? app.community.meta : null;

    const ICON_SIZE = 22;
    const sublayoutHeaderLeft = m('.sublayout-header-left', [
      (!m.route.param('scope') && (m.route.get() === '/' || m.route.get().startsWith('/?'))) ? [
        m('h3', 'Commonwealth')
      ] : chain ? [
        m(ChainIcon, { size: ICON_SIZE, chain }),
        m('h4.sublayout-header-heading', [
          link('a', `/${app.activeId()}`, chain.name),
          title && m('span.breadcrumb', m.trust('/')),
          title
        ]),
      ] : community ? [
        m(CommunityIcon, { size: ICON_SIZE, community }),
        m('h4.sublayout-header-heading', [
          link('a', `/${app.activeId()}`, community.name),
          community.privacyEnabled && m(Icon, { name: Icons.LOCK, size: 'xs' }),
          title && m('span.breadcrumb', m.trust('/')),
          title
        ]),
      ] : alwaysShowTitle ? [
        m('h4.sublayout-header-heading.no-chain-or-community', title)
      ] : [
        // empty since a chain or community is loading
      ],
    ]);

    const sublayoutHeaderRight = m('.sublayout-header-right', [
      m(LoginSelector),                                                 // login selector
      app.isLoggedIn() && app.config.invites?.length > 0 && m(Button, { // invites menu
        class: 'InvitesButton',
        iconLeft: Icons.MAIL,
        onclick: () => app.modals.create({ modal: ConfirmInviteModal }),
      }),
      app.isLoggedIn() && m(NotificationsMenu),                         // notifications menu
      showNewProposalButton && m(NewProposalButton, { fluid: false }),
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
          m(MobileSidebarHeader),
          m('.sublayout-header', { class: !title ? 'no-title' : '' }, [
            m('.sublayout-header-inner', [
              sublayoutHeaderLeft,
              m(SearchBar),
              sublayoutHeaderRight,
            ]),
          ]),
          hero
            ? m('.sublayout-hero', hero)
            : ((app.chain as Token)?.isToken && !(app.chain as Token)?.hasToken && app.isLoggedIn())
              ? m('.sublayout-hero.token-banner', [
                m('.token-banner-content', `Link ${app.chain.meta.chain.symbol} address to participate in this community`),
              ]) : '',
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
