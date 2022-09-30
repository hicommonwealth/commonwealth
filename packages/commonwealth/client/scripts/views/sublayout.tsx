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
import { isWindowSmallInclusive } from './components/component_kit/helpers';
import { CommunityHeader } from './components/sidebar/community_header';
import { MobileMenu } from './components/mobile_menu/mobile_menu';

type SublayoutAttrs = {
  hideFooter?: boolean;
  hideSearch?: boolean;
  onscroll: () => null; // lazy loading for page content
  showCreateContentMenuTrigger?: boolean;
  title?: string; // displayed at the top of the layout
};

class Sublayout implements m.ClassComponent<SublayoutAttrs> {
  private isSidebarToggled: boolean;
  private showBodyContainer: boolean;
  private showCommunityHeader: boolean;
  private showQuickSwitcher: boolean;
  private showSidebarContainer: boolean;

  checkSidebarToggles() {
    const isOnMobile = isWindowSmallInclusive(window.innerWidth);
    const storedSidebarToggleState =
      localStorage.getItem(`${app.activeChainId()}-sidebar-toggle`) === 'true';
    if (!app.chain) {
      this.isSidebarToggled = false;
      this.showQuickSwitcher = true;
    } else {
      this.isSidebarToggled = !isOnMobile || storedSidebarToggleState;
      this.showQuickSwitcher = this.isSidebarToggled;
    }
    this.showSidebarContainer = this.isSidebarToggled || this.showQuickSwitcher;
    this.showCommunityHeader = this.isSidebarToggled && this.showQuickSwitcher;
    this.showBodyContainer = !(isOnMobile && storedSidebarToggleState);
  }

  view(vnode) {
    const {
      hideFooter = false,
      hideSearch,
      onscroll,
      showCreateContentMenuTrigger,
      // title,
    } = vnode.attrs;

    const chain = app.chain ? app.chain.meta : null;
    const terms = app.chain ? chain.terms : null;
    const banner = app.chain ? chain.communityBanner : null;
    const tosStatus = localStorage.getItem(`${app.activeChainId()}-tos`);
    const bannerStatus = localStorage.getItem(`${app.activeChainId()}-banner`);

    if (m.route.param('triggerInvite') === 't') {
      setTimeout(() => handleEmailInvites(this), 0);
    }

    this.checkSidebarToggles();
    const {
      showBodyContainer,
      showSidebarContainer,
      showCommunityHeader,
      isSidebarToggled,
      showQuickSwitcher,
    } = this;

    return (
      <div class="Sublayout">
        <div class="header-and-body-container">
          <div class="header-container">
            <SublayoutHeaderLeft
              isSidebarToggled={isSidebarToggled}
              toggleSidebar={() => {
                this.isSidebarToggled = !isSidebarToggled;
              }}
            />
            {!hideSearch && <SearchBar />}
            <SublayoutHeaderRight
              chain={chain}
              showCreateContentMenuTrigger={showCreateContentMenuTrigger}
            />
          </div>
          <div class="sidebar-and-body-container">
            {showSidebarContainer && (
              <div class="sidebar-container">
                {showCommunityHeader && (
                  <CommunityHeader meta={app.chain.meta} />
                )}
                <div class="sidebar-inner-container">
                  {showQuickSwitcher && <SidebarQuickSwitcher />}
                  {isSidebarToggled && <Sidebar />}
                </div>
              </div>
            )}
            <div
              class="body-and-sticky-headers-container"
              style={showBodyContainer ? 'display:flex' : 'display:none'}
            >
              <SublayoutBanners
                banner={banner}
                chain={chain}
                terms={terms}
                tosStatus={tosStatus}
                bannerStatus={bannerStatus}
              />
              <div class="Body" onscroll={onscroll}>
                {app.mobileMenu ? (
                  <MobileMenu />
                ) : (
                  <>
                    {vnode.children}
                    {!app.isCustomDomain() && !hideFooter && <Footer />}
                  </>
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
