import React, { useState, useEffect } from 'react';

import 'sublayout.scss';

import app from 'state';
import { Sidebar } from 'views/components/sidebar';
import { AppMobileMenus } from './app_mobile_menus';
import { isWindowSmallInclusive } from './components/component_kit/helpers';
import { Footer } from './footer';
import { SublayoutBanners } from './sublayout_banners';
import { SublayoutHeader } from './sublayout_header';
import useForceRerender from 'hooks/useForceRerender';

type SublayoutProps = {
  hideFooter?: boolean;
  hideSearch?: boolean;
  onScroll?: () => void; // lazy loading for page content
} & React.PropsWithChildren;

const Sublayout = ({
  children,
  hideFooter = true,
  hideSearch,
  onScroll,
}: SublayoutProps) => {
  const forceRerender = useForceRerender();
  const [isWindowSmall, setIsWindowSmall] = useState(
    isWindowSmallInclusive(window.innerWidth)
  );

  useEffect(() => {
    app.sidebarRedraw.on('redraw', () => forceRerender());

    return () => {
      app.sidebarRedraw.off('redraw', () => forceRerender());
    };
  });

  useEffect(() => {
    if (localStorage.getItem('dark-mode-state') === 'on') {
      document.getElementsByTagName('html')[0].classList.add('invert');
    }

    const onResize = () => {
      setIsWindowSmall(isWindowSmallInclusive(window.innerWidth));
    };

    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
    };
  }, []);

  const chain = app.chain ? app.chain.meta : null;
  const terms = app.chain ? chain.terms : null;
  const banner = app.chain ? chain.communityBanner : null;
  const tosStatus = localStorage.getItem(`${app.activeChainId()}-tos`);
  const bannerStatus = localStorage.getItem(`${app.activeChainId()}-banner`);
  const showSidebar = app.sidebarToggled || !isWindowSmall;

  return (
    <div className="Sublayout">
      <div className="header-and-body-container">
        <SublayoutHeader hideSearch={hideSearch} onMobile={isWindowSmall} />
        <div className="sidebar-and-body-container">
          {showSidebar && <Sidebar />}
          <div className="body-and-sticky-headers-container">
            <SublayoutBanners
              banner={banner}
              chain={chain}
              terms={terms}
              tosStatus={tosStatus}
              bannerStatus={bannerStatus}
            />

            {isWindowSmallInclusive && app.mobileMenu ? (
              <AppMobileMenus />
            ) : (
              <div className="Body" onScroll={onScroll}>
                {children}
                {!app.isCustomDomain() && !hideFooter && <Footer />}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sublayout;
