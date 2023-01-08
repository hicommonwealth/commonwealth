/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';

import 'sublayout.scss';

import navState from 'navigationState';
import { handleEmailInvites } from 'views/menus/invites_menu';
import { Sidebar } from 'views/components/sidebar';
import chainState from 'chainState';
import { Footer } from './footer';
import { SublayoutBanners } from './sublayout_banners';
import { isWindowSmallInclusive } from './components/component_kit/helpers';
import { AppMobileMenus } from './app_mobile_menus';
import { SublayoutHeader } from './sublayout_header';

// Graham TODO 22.10.6: Reinstate titles to Sublayout as body breadcrumbs
type SublayoutAttrs = {
  hideFooter?: boolean;
  hideSearch?: boolean;
  onscroll?: () => void; // lazy loading for page content
};

class Sublayout extends ClassComponent<SublayoutAttrs> {
  private isWindowSmallInclusive: boolean;

  onResize() {
    this.isWindowSmallInclusive = isWindowSmallInclusive(window.innerWidth);
    m.redraw();
  }

  oninit() {
    if (localStorage.getItem('dark-mode-state') === 'on') {
      document.getElementsByTagName('html')[0].classList.add('invert');
    }

    this.isWindowSmallInclusive = isWindowSmallInclusive(window.innerWidth);

    window.addEventListener('resize', () => {
      this.onResize();
    });
  }

  onremove() {
    window.removeEventListener('resize', () => {
      this.onResize();
    });
  }

  view(vnode: m.Vnode<SublayoutAttrs>) {
    const { hideFooter = false, hideSearch, onscroll } = vnode.attrs;

    const chain = chainState.chain ? chainState.chain.meta : null;
    const terms = chainState.chain ? chain.terms : null;
    const banner = chainState.chain ? chain.communityBanner : null;
    const tosStatus = localStorage.getItem(`${navState.activeChainId()}-tos`);
    const bannerStatus = localStorage.getItem(`${navState.activeChainId()}-banner`);
    const showSidebar = navState.sidebarToggled || !this.isWindowSmallInclusive;

    if (m.route.param('triggerInvite') === 't') {
      setTimeout(() => handleEmailInvites(this), 0);
    }

    return (
      <div class="Sublayout">
        <div class="header-and-body-container">
          <SublayoutHeader
            hideSearch={hideSearch}
            onMobile={this.isWindowSmallInclusive}
          />
          <div class="sidebar-and-body-container">
            {showSidebar && <Sidebar />}
            <div class="body-and-sticky-headers-container">
              <SublayoutBanners
                banner={banner}
                chain={chain}
                terms={terms}
                tosStatus={tosStatus}
                bannerStatus={bannerStatus}
              />

              {this.isWindowSmallInclusive && navState.mobileMenu ? (
                <AppMobileMenus />
              ) : (
                <div class="Body" onscroll={onscroll}>
                  {vnode.children}
                  {!navState.isCustomDomain() && !hideFooter && <Footer />}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Sublayout;
