/* @jsx m */

import m from 'mithril';
import { EmptyState, Icons, Spinner } from 'construct-ui';

import 'sublayout.scss';

import app from 'state';
import { ITokenAdapter } from 'models';
import { handleEmailInvites } from 'views/components/header/invites_menu';
import Sidebar from 'views/components/sidebar';
import MobileHeader from 'views/mobile/mobile_header';
import { FooterLandingPage } from 'views/pages/landing/landing_page_footer';
import { SearchBar } from './components/search_bar';
import { SublayoutHeaderLeft } from './components/sublayout_header_left';
import { SublayoutHeaderRight } from './components/sublayout_header_right';
import {
  isNonEmptyString,
  isNotUndefined,
  isUndefined,
} from '../helpers/typeGuards';

type SublayoutAttrs = {
  alwaysShowTitle?: boolean; // show page title even if app.chain and app.community are unavailable
  hasCenterGrid?: boolean;
  class?: string;
  description?: string; // displayed at the top of the layout
  errorLayout?: m.Vnode<any, any>[];
  hero?: any;
  hideSearch?: boolean;
  hideSidebar?: boolean;
  isLoadingLayout?: boolean;
  rightContent?: any;
  showCouncilMenu?: boolean;
  showNewProposalButton?: boolean;
  title?: any; // displayed at the top of the layout
  useQuickSwitcher?: boolean; // show quick switcher only, without the rest of the sidebar
};

const footercontents = [
  { text: 'Blog', externalLink: 'https://blog.commonwealth.im' },
  {
    text: 'Jobs',
    externalLink: 'https://angel.co/company/commonwealth-labs/jobs',
  },
  { text: 'Terms', redirectTo: '/terms' },
  { text: 'Privacy', redirectTo: '/privacy' },
  { text: 'Docs', externalLink: 'https://docs.commonwealth.im' },
  {
    text: 'Discord',
    externalLink: 'https://discord.gg/t9XscHdZrG',
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
];

class Sublayout implements m.ClassComponent<SublayoutAttrs> {
  private modalAutoTriggered: boolean; // what's going on here?

  view(vnode) {
    const {
      alwaysShowTitle,
      description, // ?
      errorLayout,
      hasCenterGrid,
      hero,
      hideSearch,
      hideSidebar, // ?
      isLoadingLayout,
      rightContent,
      showCouncilMenu, // ?
      showNewProposalButton,
      title,
      useQuickSwitcher,
    } = vnode.attrs;

    const chain = app.chain ? app.chain.meta.chain : null;
    const terms = app.chain ? chain.terms : null;
    const sidebarOpen = app.chain !== null;
    const tosStatus = localStorage.getItem(`${app.activeChainId()}-tos`);

    const heroContent = () => {
      if (isNotUndefined(hero)) {
        return <div class="sublayout-hero">{hero}</div>;
      } else if (
        app.isLoggedIn() &&
        ITokenAdapter.instanceOf(app.chain) &&
        !app.user.activeAccount
      ) {
        return (
          <div class="sublayout-hero token-banner">
            <div class="token-banner-content">
              Link an address that holds {chain.symbol} to participate in
              governance.
            </div>
          </div>
        );
      } else {
        return null;
      }
    };

    const termsContent = () => {
      if (isNonEmptyString(terms) && tosStatus !== 'off') {
        return (
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
        );
      } else {
        return null;
      }
    };

    if (m.route.param('triggerInvite') === 't') {
      setTimeout(() => handleEmailInvites(this), 0);
    }

    if (isLoadingLayout) {
      return (
        <div class="layout-container">
          <div class="LoadingLayout">
            <Spinner active={true} fill={true} size="xl" />
          </div>
        </div>
      );
    }

    if (isNotUndefined(errorLayout)) {
      return (
        <div class="layout-container">
          <EmptyState
            fill={true}
            icon={Icons.ALERT_TRIANGLE}
            content={errorLayout}
            style="color: #546e7b;"
          />
        </div>
      );
    }

    return (
      <div class="layout-container">
        <div class={`Sublayout ${vnode.attrs.class}`}>
          {m(MobileHeader)}
          <div
            class={`sublayout-header ${isUndefined(title) ? 'no-title' : ''}`}
          >
            <div class="sublayout-header-inner">
              <SublayoutHeaderLeft
                alwaysShowTitle={alwaysShowTitle}
                chain={chain}
                title={title}
              />
              {!isLoadingLayout && !hideSearch && m(SearchBar)}
              <SublayoutHeaderRight
                chain={chain}
                showNewProposalButton={showNewProposalButton}
              />
            </div>
          </div>
          {heroContent()}
          {termsContent()}
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
            <div class={`sublayout-grid ${hasCenterGrid ? 'flex-center' : ''}`}>
              <div
                class={`sublayout-main-col ${
                  isUndefined(rightContent) ? 'no-right-content' : ''
                }`}
              >
                {vnode.children}
              </div>
              {isNotUndefined(rightContent) && (
                <div class="sublayout-right-col">{rightContent}</div>
              )}
            </div>
          </div>
          {!app.isCustomDomain() && <FooterLandingPage list={footercontents} />}
        </div>
      </div>
    );
  }
}

export default Sublayout;
