/* @jsx m */

import m from 'mithril';

import 'sublayout.scss';

import app from 'state';
import { handleEmailInvites } from 'views/menus/invites_menu';
import { Sidebar } from 'views/components/sidebar';
import { SidebarQuickSwitcher } from './components/sidebar/sidebar_quick_switcher';
import { Footer } from './footer';
import { SublayoutBanners } from './sublayout_banners';
import {
  getClasses,
  isWindowSmallInclusive,
} from './components/component_kit/helpers';
import { CommunityHeader } from './components/sidebar/community_header';
import { AppMobileMenus } from './app_mobile_menus';
import { SublayoutHeader } from './sublayout_header';

// Graham TODO 22.10.6: Reinstate titles to Sublayout as body breadcrumbs
type SublayoutAttrs = {
  hideFooter?: boolean;
  hideSearch?: boolean;
  onscroll: () => null; // lazy loading for page content
};

class Sublayout implements m.ClassComponent<SublayoutAttrs> {
  private isSidebarToggled: boolean;
  private showQuickSwitcher: boolean;

  oninit() {
    if (localStorage.getItem('dark-mode-state') === 'on') {
      document.getElementsByTagName('html')[0].classList.add('invert');
    }
  }

  view(vnode) {
    const { hideFooter = false, hideSearch, onscroll } = vnode.attrs;

    const chain = app.chain ? app.chain.meta : null;
    const terms = app.chain ? chain.terms : null;
    const banner = app.chain ? chain.communityBanner : null;
    const tosStatus = localStorage.getItem(`${app.activeChainId()}-tos`);
    const bannerStatus = localStorage.getItem(`${app.activeChainId()}-banner`);

    if (m.route.param('triggerInvite') === 't') {
      setTimeout(() => handleEmailInvites(this), 0);
    }

    const storedSidebarToggleState =
      localStorage.getItem(`${app.activeChainId()}-sidebar-toggle`) === 'true';

    if (!app.chain) {
      this.isSidebarToggled = false;
      this.showQuickSwitcher = true;
    } else {
      this.isSidebarToggled =
        !isWindowSmallInclusive(window.innerWidth) || storedSidebarToggleState;
      this.showQuickSwitcher = this.isSidebarToggled;
    }

    if (!isWindowSmallInclusive(window.innerWidth)) {
      delete app.mobileMenu;
    }

    return (
      <div class="Sublayout">
        <div class="header-and-body-container">
          <SublayoutHeader
            hideSearch={hideSearch}
            isSidebarToggled={this.isSidebarToggled}
            toggleSidebar={() => {
              this.isSidebarToggled = !this.isSidebarToggled;
            }}
          />
          <div class="sidebar-and-body-container">
            {(this.isSidebarToggled || this.showQuickSwitcher) && (
              <div class="sidebar-container">
                {this.isSidebarToggled && this.showQuickSwitcher && (
                  <CommunityHeader meta={app.chain.meta} />
                )}
                <div class="sidebar-inner-container">
                  {this.showQuickSwitcher && <SidebarQuickSwitcher />}
                  <Sidebar isSidebarToggled={this.isSidebarToggled} />
                </div>
              </div>
            )}
            <div
              class={getClasses<{ isSidebarToggled: boolean }>(
                { isSidebarToggled: this.isSidebarToggled },
                'body-and-sticky-headers-container'
              )}
            >
              <SublayoutBanners
                banner={banner}
                chain={chain}
                terms={terms}
                tosStatus={tosStatus}
                bannerStatus={bannerStatus}
              />

              {app.mobileMenu ? (
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
