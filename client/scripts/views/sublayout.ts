import 'sublayout.scss';

import m, { Vnode } from 'mithril';
import app from 'state';
import { EmptyState, Button, Icon, Icons, Grid, Col, Spinner } from 'construct-ui';
import { link } from 'helpers';

import NewProposalButton, { MobileNewProposalButton } from 'views/components/new_proposal_button';
import NotificationsMenu from 'views/components/header/notifications_menu';
import InvitesMenu, { handleEmailInvites } from 'views/components/header/invites_menu';
import LoginSelector from 'views/components/header/login_selector';
import Sidebar from 'views/components/sidebar';
import MobileHeader from 'views/mobile/mobile_header';
import { ChainIcon, CommunityIcon } from 'views/components/chain_icon';
import FooterLandingPage from 'views/pages/landing/landing_page_footer';
import Token from 'controllers/chain/ethereum/token/adapter';
import { SearchBar } from './components/search_bar';


const Sublayout: m.Component<{
  // overrides
  loadingLayout?: boolean,
  errorLayout?,

  // content
  class?: string,
  title?: any,                        // displayed at the top of the layout
  description?: string,               // displayed at the top of the layout
  rightContent?: any,
  hero?: any,
  showNewProposalButton?: boolean,
  showCouncilMenu?: boolean,
  hideSidebar?: boolean,
  hideSearch?: boolean,
  centerGrid?: boolean,
  alwaysShowTitle?: boolean,          // show page title even if app.chain and app.community are unavailable
}, {
  modalAutoTriggered: boolean
}> = {
  view: (vnode) => {
    const {
      title,
      description,
      rightContent,
      hero,
      showNewProposalButton,
      showCouncilMenu,
      hideSidebar,
      hideSearch,
      alwaysShowTitle,
    } = vnode.attrs;

    const chain = app.chain ? app.chain.meta.chain : null;
    const community = app.community ? app.community.meta : null;
    const narrowBrowserWidth = (window.innerWidth > 767.98) && (window.innerWidth < 850);

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
      m(LoginSelector),
      app.isLoggedIn() && m(InvitesMenu),
      app.isLoggedIn() && m(NotificationsMenu),
      showNewProposalButton
      && (narrowBrowserWidth ? m(MobileNewProposalButton) : m(NewProposalButton, { fluid: false })),
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

    if (m.route.param('triggerInvite') === 't') {
      setTimeout(() => handleEmailInvites(vnode.state), 0);
    }

    return [
      m('.layout-container', [
        m('.Sublayout', { class: vnode.attrs.class }, [
          m(MobileHeader),
          m('.sublayout-header', { class: !title ? 'no-title' : '' }, [
            m('.sublayout-header-inner', [
              sublayoutHeaderLeft,
              !vnode.attrs.loadingLayout && !hideSearch && m(SearchBar),
              sublayoutHeaderRight,
            ]),
          ]),
          hero
            ? m('.sublayout-hero', hero)
            : (app.isLoggedIn() && (app.chain as Token)?.isToken && !(app.chain as Token)?.hasToken)
              ? m('.sublayout-hero.token-banner', [
                m('.token-banner-content', `Link ${app.chain.meta.chain.symbol} address to participate in this community`),
              ]) : '',
          m('.sublayout-body', [
            m(`.sublayout-grid${vnode.attrs.centerGrid ? '.flex-center' : ''}`, [
              !hideSidebar && m('.sublayout-sidebar-col', [
                m(Sidebar),
              ]),
              m('.sublayout-main-col', [
                vnode.children
              ]),
              rightContent && m('.sublayout-right-col', rightContent),
            ]),
          ]),
          m(FooterLandingPage, {
            list: [
              { text: 'Blog', externalLink: 'https://blog.commonwealth.im' },
              { text: 'Jobs', externalLink: 'https://angel.co/company/commonwealth-labs/jobs' },
              { text:  'Terms', redirectTo:  '/terms' },
              { text:  'Privacy', redirectTo: '/privacy' },
              { text: 'Discord', externalLink: 'https://discord.gg/ZFQCKUMP' },
              { text: 'Telegram', externalLink: 'https://t.me/HiCommonwealth' }
              // { text:  'Use Cases' },
              // { text:  'Crowdfunding' },
              // { text:  'Developers' },
              // { text:  'About us' },
              // { text:  'Careers' }
            ],
          }),
        ]),
      ]),
    ];
  }
};

export default Sublayout;
