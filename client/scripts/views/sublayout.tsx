/* @jsx m */

import m from 'mithril';
import { EmptyState, Icons, Spinner } from 'construct-ui';

import 'sublayout.scss';

import app from 'state';
import { link } from 'helpers';
import { ITokenAdapter } from 'models';
import NewProposalButton, {
  MobileNewProposalButton,
} from 'views/components/new_proposal_button';
import NotificationsMenu from 'views/components/header/notifications_menu';
import InvitesMenu, {
  handleEmailInvites,
} from 'views/components/header/invites_menu';
import LoginSelector from 'views/components/header/login_selector';
import Sidebar from 'views/components/sidebar';
import MobileHeader from 'views/mobile/mobile_header';
import { ChainIcon } from 'views/components/chain_icon';
import FooterLandingPage from 'views/pages/landing/landing_page_footer';
import { SearchBar } from './components/search_bar';
import { CommunityOptionsPopover } from './pages/discussions';
import { CWGradientButton } from './components/component_kit/cw_gradient_button';

type SublayoutAttrs = {
  alwaysShowTitle?: boolean; // show page title even if app.chain and app.community are unavailable
  centerGrid?: boolean;
  class?: string;
  description?: string; // displayed at the top of the layout
  errorLayout?;
  hero?: any;
  hideSearch?: boolean;
  hideSidebar?: boolean;
  loadingLayout?: boolean;
  rightContent?: any;
  showCouncilMenu?: boolean;
  showNewProposalButton?: boolean;
  title?: any; // displayed at the top of the layout
  useQuickSwitcher?: boolean; // show quick switcher only, without the rest of the sidebar
};

class Sublayout implements m.ClassComponent<SublayoutAttrs> {
  view(vnode) {
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
      useQuickSwitcher,
    } = vnode.attrs;

    const chain = app.chain ? app.chain.meta.chain : null;
    const narrowBrowserWidth =
      window.innerWidth > 767.98 && window.innerWidth < 850;
    const terms = app.chain ? chain.terms : null;

    const ICON_SIZE = 22;

    const sublayoutHeaderLeft = (
      <div class="sublayout-header-left">
        {!app.activeChainId() &&
        !app.isCustomDomain() &&
        (m.route.get() === '/' || m.route.get().startsWith('/?')) ? (
          <h3>Commonwealth</h3>
        ) : chain ? (
          <div>
            <div class="ChainIcon">
              {link(
                'a',
                !app.isCustomDomain() ? `/${app.activeChainId()}` : '/',
                <ChainIcon size={ICON_SIZE} chain={chain} />
              )}
            </div>
            <h4 class="sublayout-header-heading">
              {link(
                'a',
                app.isCustomDomain() ? '/' : `/${app.activeChainId()}`,
                chain.name
              )}
              {title && <span class="breadcrumb">{m.trust('/')}</span>}
              {title}
              {m(CommunityOptionsPopover)}
            </h4>
          </div>
        ) : alwaysShowTitle ? (
          <h4 class="sublayout-header-heading.no-chain-or-community">
            {title}
          </h4>
        ) : null}
      </div>
    );

    const hiringButton = (
      <CWGradientButton
        buttonType="secondary"
        disabled={false}
        className="hiringBtn"
        label="We're hiring!"
        onclick={() => {
          window.open('https://angel.co/company/commonwealth-labs', '_blank');
        }}
      />
    );

    const sublayoutHeaderRight = (
      <div class="sublayout-header-right">
        {m(LoginSelector)}
        {app.isLoggedIn() && m(InvitesMenu)}
        {app.isLoggedIn() && m(NotificationsMenu)}
        {showNewProposalButton &&
          (narrowBrowserWidth
            ? m(MobileNewProposalButton)
            : m(NewProposalButton, { fluid: false, threadOnly: !chain }))}
        {!app.isCustomDomain() && hiringButton}
        {/* above threadOnly option assumes all chains have proposals beyond threads */}
      </div>
    );

    if (vnode.attrs.loadingLayout) {
      return (
        <div class="layout-container">
          <div class="LoadingLayout">
            <Spinner active={true} fill={true} size="xl" />
          </div>
        </div>
      );
    }

    if (vnode.attrs.errorLayout) {
      return (
        <div class="layout-container">
          <EmptyState
            fill={true}
            icon={Icons.ALERT_TRIANGLE}
            content={vnode.attrs.errorLayout}
            style="color: #546e7b;"
          />
        </div>
      );
    }

    if (m.route.param('triggerInvite') === 't') {
      setTimeout(() => handleEmailInvites(vnode.state), 0);
    }

    const sidebarOpen = app.chain !== null;
    const tosStatus = localStorage.getItem(`${app.activeChainId()}-tos`);

    return (
      <div class="layout-container">
        <div class={`Sublayout ${vnode.attrs.class}`}>
          {m(MobileHeader)}
          <div class={`sublayout-header ${!title ? 'no-title' : ''}`}>
            <div class="sublayout-header-inner">
              {sublayoutHeaderLeft}
              {!vnode.attrs.loadingLayout && !hideSearch && m(SearchBar)}
              {sublayoutHeaderRight}
            </div>
          </div>
          {hero ? (
            <div class="sublayout-hero">{hero}</div>
          ) : app.isLoggedIn() &&
            ITokenAdapter.instanceOf(app.chain) &&
            !app.user.activeAccount ? (
            <div class="sublayout-hero.token-banner">
              <div class="token-banner-content">
                Link an address that holds {chain.symbol} to participate in
                governance.
              </div>
            </div>
          ) : null}
          {terms && tosStatus !== 'off' ? (
            <div class="token-banner-terms">
              <span>Please read the </span>
              <a href={terms}>terms and conditions</a>
              <span> before interacting with this community.</span>
              <span
                class="close-button"
                onclick={() => {
                  localStorage.setItem(`${app.activeChainId()}-tos`, 'off');
                }}
              >
                X
              </span>
            </div>
          ) : null}
          <div
            class={
              useQuickSwitcher
                ? 'sublayout-quickswitcheronly-col'
                : 'sublayout-sidebar-col'
            }
          >
            {m(Sidebar, { useQuickSwitcher })}
          </div>
          <div
            class={!sidebarOpen ? 'sublayout-body' : 'sublayout-body-sidebar'}
          >
            <div
              class={`sublayout-grid ${
                vnode.attrs.centerGrid ? 'flex-center' : ''
              }`}
            >
              <div
                class={`sublayout-main-col ${
                  !rightContent && 'no-right-content'
                }`}
              >
                {vnode.children}
              </div>
              {rightContent && (
                <div class="sublayout-right-col">{rightContent}</div>
              )}
            </div>
          </div>
          {!app.isCustomDomain() &&
            m(FooterLandingPage, {
              list: [
                { text: 'Blog', externalLink: 'https://blog.commonwealth.im' },
                {
                  text: 'Jobs',
                  externalLink:
                    'https://angel.co/company/commonwealth-labs/jobs',
                },
                { text: 'Terms', redirectTo: '/terms' },
                { text: 'Privacy', redirectTo: '/privacy' },
                { text: 'Docs', externalLink: 'https://docs.commonwealth.im' },
                {
                  text: 'Discord',
                  externalLink: 'https://discord.gg/vYcfQ758',
                },
                {
                  text: 'Telegram',
                  externalLink: 'https://t.me/HiCommonwealth',
                },
                // { text:  'Use Cases' },
                // { text:  'Crowdfunding' },
                // { text:  'Developers' },
                // { text:  'About us' },
                // { text:  'Careers' }
              ],
            })}
        </div>
      </div>
    );
  }
}

export default Sublayout;
