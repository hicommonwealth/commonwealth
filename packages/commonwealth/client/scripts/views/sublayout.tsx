/* @jsx m */

import m from 'mithril';

import 'sublayout.scss';

import app from 'state';
import { handleEmailInvites } from 'views/menus/invites_menu';
import { Sidebar } from 'views/components/sidebar';
import { SearchBar } from './components/search_bar';
import { SublayoutHeaderLeft } from './sublayout_header_left';
import { SublayoutHeaderRight } from './sublayout_header_right';
import { SidebarQuickSwitcher } from './components/sidebar/sidebar_quick_switcher';
import { Footer } from './footer';
import { SublayoutBanners } from './sublayout_banners';
import { isWindowSmallMax } from './components/component_kit/helpers';
import { CommunityHeader } from './components/sidebar/community_header';
import { AppMobileMenus } from './app_mobile_menus';

// Graham TODO 22.10.6: Reinstate titles to Sublayout as body breadcrumbs
type SublayoutAttrs = {
  hideFooter?: boolean;
  hideSearch?: boolean;
  onscroll: () => null; // lazy loading for page content
};

class Sublayout implements m.ClassComponent<SublayoutAttrs> {
  private isSidebarToggled: boolean;
  private showBodyContainer: boolean;
  private showCommunityHeader: boolean;
  private showQuickSwitcher: boolean;
  private showSidebarContainer: boolean;

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
      const toggleSidebar =
        !isWindowSmallMax.matches || storedSidebarToggleState;
      this.isSidebarToggled = toggleSidebar;
      this.showQuickSwitcher = toggleSidebar;
    }

    this.showSidebarContainer = this.isSidebarToggled || this.showQuickSwitcher;

    this.showCommunityHeader = this.isSidebarToggled && this.showQuickSwitcher;

    this.showBodyContainer = !(
      isWindowSmallMax.matches && storedSidebarToggleState
    );

    return (
      <div class="Sublayout">
        <div class="header-and-body-container">
          <div class="header-container">
            <SublayoutHeaderLeft
              isSidebarToggled={this.isSidebarToggled}
              toggleSidebar={() => {
                this.isSidebarToggled = !this.isSidebarToggled;
              }}
            />
            {!hideSearch && <SearchBar />}
            <SublayoutHeaderRight chain={chain} />
          </div>
          <div class="sidebar-and-body-container">
            {this.showSidebarContainer && (
              <div class="sidebar-container">
                {this.showCommunityHeader && (
                  <CommunityHeader meta={app.chain.meta} />
                )}
                <div class="sidebar-inner-container">
                  {this.showQuickSwitcher && <SidebarQuickSwitcher />}
                  {this.isSidebarToggled && <Sidebar />}
                </div>
              </div>
            )}
            <div
              class="body-and-sticky-headers-container"
              style={this.showBodyContainer ? 'display:flex' : 'display:none'}
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
