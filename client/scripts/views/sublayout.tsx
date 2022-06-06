/* @jsx m */

import m from 'mithril';

import 'sublayout.scss';

import app from 'state';
import { handleEmailInvites } from 'views/components/header/invites_menu';
import { Sidebar } from 'views/components/sidebar';
import { MobileHeader } from 'views/mobile/mobile_header';
import { SearchBar } from './components/search_bar';
import { SublayoutHeaderLeft } from './sublayout_header_left';
import { SublayoutHeaderRight } from './sublayout_header_right';
import { TokenHero } from './token_hero';
import { TokenTerms } from './token_terms';
import { SidebarQuickSwitcher } from './components/sidebar/sidebar_quick_switcher';
import { Footer } from './footer';

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
    const tosStatus = localStorage.getItem(`${app.activeChainId()}-tos`);

    if (m.route.param('triggerInvite') === 't') {
      setTimeout(() => handleEmailInvites(this), 0);
    }

    return (
      <div class="Sublayout">
        {!app.isCustomDomain() && <SidebarQuickSwitcher />}
        <div class="header-and-body-container">
          <MobileHeader />
          <div class="header-container">
            <SublayoutHeaderLeft
              alwaysShowTitle={alwaysShowTitle}
              chain={chain}
              title={title}
            />
            {!hideSearch && m(SearchBar)}
            <SublayoutHeaderRight
              chain={chain}
              showNewProposalButton={showNewProposalButton}
            />
          </div>
          <div class="sidebar-and-body-container">
            <Sidebar />
            <div class="body-and-sticky-headers-container">
              <TokenHero chain={chain} />
              <TokenTerms terms={terms} tosStatus={tosStatus} />
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
