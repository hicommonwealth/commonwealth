/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';

import 'sublayout.scss';

import app from 'state';
import { handleEmailInvites } from 'views/menus/invites_menu';
import { Sidebar } from 'views/components/sidebar';
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
  private isSidebarToggled: boolean;
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

    const chain = app.chain ? app.chain.meta : null;
    const terms = app.chain ? chain.terms : null;
    const banner = app.chain ? chain.communityBanner : null;
    const tosStatus = localStorage.getItem(`${app.activeChainId()}-tos`);
    const bannerStatus = localStorage.getItem(`${app.activeChainId()}-banner`);

    if (m.route.param('triggerInvite') === 't') {
      setTimeout(() => handleEmailInvites(this), 0);
    }

    const isSidebarToggleable = app.chain && this.isWindowSmallInclusive;
    this.isSidebarToggled =
      localStorage.getItem(`${app.activeChainId()}-sidebar-toggle`) === 'true';

    return (
      <div class="Sublayout">
        <div class="header-and-body-container">
          <SublayoutHeader
            hideSearch={hideSearch}
            isSidebarToggleable={isSidebarToggleable}
            isSidebarToggled={this.isSidebarToggled}
            toggleSidebar={() => {
              this.isSidebarToggled = !this.isSidebarToggled;
            }}
          />
          <div class="sidebar-and-body-container">
            <Sidebar
              isSidebarToggleable={isSidebarToggleable}
              isSidebarToggled={this.isSidebarToggled}
            />
            <div class="body-and-sticky-headers-container">
              <SublayoutBanners
                banner={banner}
                chain={chain}
                terms={terms}
                tosStatus={tosStatus}
                bannerStatus={bannerStatus}
              />

              {this.isWindowSmallInclusive && app.mobileMenu ? (
                <AppMobileMenus />
              ) : (
                <div class="Body" onscroll={onscroll}>
                  {vnode.children}
                  {!app.isCustomDomain() && !hideFooter && <Footer />}
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
