/* @jsx m */

import m from 'mithril';

import 'sublayout.scss';

import app from 'state';
import { handleEmailInvites } from 'views/components/header/invites_menu';
import { Sidebar } from 'views/components/sidebar';
import { SearchBar } from './components/search_bar';
import { SublayoutHeaderLeft } from './sublayout_header_left';
import { SublayoutHeaderRight } from './sublayout_header_right';
import { SidebarQuickSwitcher } from './components/sidebar/sidebar_quick_switcher';
import { Footer } from './footer';
import { SublayoutBanners } from './sublayout_banners';
import { isWindowMediumSmallInclusive } from './components/component_kit/helpers';
import { CommunityHeader } from './components/sidebar/community_header';

type SublayoutAttrs = {
  alwaysShowTitle?: boolean; // show page title even if app.chain and app.community are unavailable
  hideFooter?: boolean;
  hideSearch?: boolean;
  onscroll: () => null; // lazy loading for page content
  showNewProposalButton?: boolean;
  title?: string; // displayed at the top of the layout
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
  private sidebarToggled: boolean;

  view(vnode) {
    const {
      alwaysShowTitle,
      hideFooter = false,
      hideSearch,
      onscroll,
      showNewProposalButton,
      title,
    } = vnode.attrs;

    const chain = app.chain ? app.chain.meta : null;
    const terms = app.chain ? chain.terms : null;
    const banner = app.chain ? chain.communityBanner : null;
    const tosStatus = localStorage.getItem(`${app.activeChainId()}-tos`);
    const bannerStatus = localStorage.getItem(`${app.activeChainId()}-banner`);

    const largeBrowserSize = !isWindowMediumSmallInclusive(window.innerWidth);
    const localStorageToggle =
      localStorage.getItem('sidebar-toggle') === 'true';
    if (largeBrowserSize || localStorageToggle) {
      this.sidebarToggled = true;
    }
    const { sidebarToggled } = this;

    if (m.route.param('triggerInvite') === 't') {
      setTimeout(() => handleEmailInvites(this), 0);
    }

    return (
      <div class="Sublayout">
        <div class="header-and-body-container">
          <div class="header-container">
            <SublayoutHeaderLeft parentState={this} />
            {!hideSearch && m(SearchBar)}
            <SublayoutHeaderRight
              chain={chain}
              showNewProposalButton={showNewProposalButton}
            />
          </div>
          <div class="sidebar-and-body-container">
            <div class={`sidebar-container ${sidebarToggled ? 'toggled' : ''}`}>
              <CommunityHeader />
              {!app.isCustomDomain() && <SidebarQuickSwitcher />}
              <Sidebar />
            </div>
            <div class="body-and-sticky-headers-container">
              <SublayoutBanners
                banner={banner}
                chain={chain}
                terms={terms}
                tosStatus={tosStatus}
                bannerStatus={bannerStatus}
              />
              <div class="Body" onscroll={onscroll}>
                {vnode.children}
                {!app.isCustomDomain() && !hideFooter && (
                  <Footer list={footercontents} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Sublayout;
