import 'sublayout.scss';

import m, { Vnode } from 'mithril';
import app from 'state';
import { EmptyState, Button, Icon, Icons, Grid, Col, Spinner } from 'construct-ui';
import { link } from 'helpers';
import { ITokenAdapter } from 'models';

import NewProposalButton, { MobileNewProposalButton } from 'views/components/new_proposal_button';
import NotificationsMenu from 'views/components/header/notifications_menu';
import InvitesMenu, { handleEmailInvites } from 'views/components/header/invites_menu';
import LoginSelector from 'views/components/header/login_selector';
import Sidebar from 'views/components/sidebar';
import MobileHeader from 'views/mobile/mobile_header';
import { ChainIcon, CommunityIcon } from 'views/components/chain_icon';
import FooterLandingPage from 'views/pages/landing/landing_page_footer';
import { SearchBar } from './components/search_bar';
import { CommunityOptionsPopover } from './pages/discussions';
import { ButtonIntent, FaceliftButton, FaceliftGradientButton, GradientType } from 'views/components/component_kit/buttons';

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
  useQuickSwitcher?: boolean,         // show quick switcher only, without the rest of the sidebar
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
      useQuickSwitcher
    } = vnode.attrs;

    const chain = app.chain ? app.chain.meta.chain : null;
    const community = app.community ? app.community.meta : null;
    const narrowBrowserWidth = (window.innerWidth > 767.98) && (window.innerWidth < 850);
    const terms = app.chain ? chain.terms : null;

    const ICON_SIZE = 22;
    const sublayoutHeaderLeft = m('.sublayout-header-left', [
      (!app.activeId() && !app.isCustomDomain() && (m.route.get() === '/' || m.route.get().startsWith('/?'))) ? [
        m('h3', 'Commonwealth')
      ] : chain ? [
        m('.ChainIcon', [
          link('a', (!app.isCustomDomain() ? `/${app.activeId()}` : '/'), [
            m(ChainIcon, { size: ICON_SIZE, chain })
          ])
        ]),
        m('h4.sublayout-header-heading', [
          link('a', (app.isCustomDomain() ? '/' : `/${app.activeId()}`), chain.name),
          title && m('span.breadcrumb', m.trust('/')), 
          title,
          m(CommunityOptionsPopover),
        ])
      ] : community ? [
        m('.ChainIcon', [
          link('a', (!app.isCustomDomain() ? `/${app.activeId()}` : '/'), [
            m(CommunityIcon, { size: ICON_SIZE, community })
          ])
        ]),
        m('h4.sublayout-header-heading', [
          m('div.sublayout-header-heading-wrapper', [
            link('a', (app.isCustomDomain() ? '/' : `/${app.activeId()}`), community.name),
          ]),
          community.privacyEnabled && m(Icon, { name: Icons.LOCK, size: 'xs' }),
          title && m('span.breadcrumb', m.trust('/')),
          title,
          m(CommunityOptionsPopover),
        ]),
      ] : alwaysShowTitle ? [
        m('h4.sublayout-header-heading.no-chain-or-community', title)
      ] : [
        // empty since a chain or community is loading
      ],
    ]);

    const hiringButton = m(FaceliftGradientButton, {
      intent: ButtonIntent.Secondary,
      label: "We're hiring!",
      onclick: () => {
        window.open(
          'https://angel.co/company/commonwealth-labs',
          '_blank'
        );
      },
      disabled: false,
      className: '.hiringBtn',
      gradient: GradientType.RAINBOW
    });

    const sublayoutHeaderRight = m('.sublayout-header-right', [
      m(LoginSelector),
      app.isLoggedIn() && m(InvitesMenu),
      app.isLoggedIn() && m(NotificationsMenu),
      showNewProposalButton
      && (narrowBrowserWidth ? m(MobileNewProposalButton) : m(NewProposalButton, { fluid: false, threadOnly: !chain })),
      hiringButton,
      // above threadOnly option assumes all chains have proposals beyond threads
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

    const tosStatus = localStorage.getItem(`${app.activeId()}-tos`);

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
            : (app.isLoggedIn() && ITokenAdapter.instanceOf(app.chain) && !app.user.activeAccount)
              ? m('.sublayout-hero.token-banner', [
                m('.token-banner-content', `Link an address that holds ${chain.symbol} to participate in governance.`),
              ]) : '',
          terms && tosStatus !== 'off'
            ? m('.token-banner-terms', [
              m('span', 'Please read the '),
              m('a', {
                href: terms,
              }, 'terms and conditions'),
              m('span', ' before interacting with this community.'),
              m('span', { class: 'close-button',
                onclick: () => {
                  localStorage.setItem(`${app.activeId()}-tos`, 'off');
                } }, 'X')
            ]) : '',
          m('.sublayout-body', [
            m(`.sublayout-grid${vnode.attrs.centerGrid ? '.flex-center' : ''}`, [
              !hideSidebar && m((useQuickSwitcher ? '.sublayout-quickswitcheronly-col' : '.sublayout-sidebar-col'), [
                m(Sidebar, { useQuickSwitcher: useQuickSwitcher }),
              ]),
              m('.sublayout-main-col', {
                class: !rightContent && 'no-right-content'
              }, [
                vnode.children
              ]),
              rightContent && m('.sublayout-right-col', rightContent),
            ]),
          ]),
          !app.isCustomDomain() && m(FooterLandingPage, {
            list: [
              { text: 'Blog', externalLink: 'https://blog.commonwealth.im' },
              { text: 'Jobs', externalLink: 'https://angel.co/company/commonwealth-labs/jobs' },
              { text: 'Terms', redirectTo:  '/terms' },
              { text: 'Privacy', redirectTo: '/privacy' },
              { text: 'Docs', redirectTo: 'https://docs.commonwealth.im' },
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
