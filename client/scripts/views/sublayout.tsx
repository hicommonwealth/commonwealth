/* @jsx m */

import m from 'mithril';

import 'sublayout.scss';

import app from 'state';
import { handleEmailInvites } from 'views/components/header/invites_menu';
import { Sidebar } from 'views/components/sidebar';
import { MobileHeader } from 'views/mobile/mobile_header';
import { FooterLandingPage } from 'views/pages/landing/landing_page_footer';
import { SearchBar } from './components/search_bar';
import { SublayoutHeaderLeft } from './components/sublayout_header_left';
import { SublayoutHeaderRight } from './components/sublayout_header_right';
import { isNotUndefined, isUndefined } from '../helpers/typeGuards';
import { TokenHero } from './token_hero';
import { TokenTerms } from './token_terms';

type SublayoutAttrs = {
  alwaysShowTitle?: boolean; // show page title even if app.chain and app.community are unavailable
  hasCenterGrid?: boolean;
  class?: string;
  description?: string; // displayed at the top of the layout
  hero?: any;
  hideSearch?: boolean;
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
  view(vnode) {
    const {
      alwaysShowTitle,
      description, // ?
      hasCenterGrid,
      hero,
      hideSearch,
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

    if (m.route.param('triggerInvite') === 't') {
      setTimeout(() => handleEmailInvites(this), 0);
    }

    return (
      <div class={`Sublayout ${vnode.attrs.class}`}>
        <MobileHeader />
        <div class={`sublayout-header ${isUndefined(title) ? 'no-title' : ''}`}>
          <div class="sublayout-header-inner">
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
        </div>
        <TokenHero chain={chain} hero={hero} />
        <TokenTerms terms={terms} tosStatus={tosStatus} />
        <div
          class={
            useQuickSwitcher
              ? 'sublayout-quickswitcheronly-col'
              : 'sublayout-sidebar-col'
          }
        >
          <Sidebar useQuickSwitcher={useQuickSwitcher} />
        </div>
        <div class={!sidebarOpen ? 'sublayout-body' : 'sublayout-body-sidebar'}>
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
    );
  }
}

export default Sublayout;
