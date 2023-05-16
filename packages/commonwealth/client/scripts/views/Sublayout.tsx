import React, { useState, useEffect } from 'react';

import 'Sublayout.scss';

import app from 'state';
import { Sidebar } from 'views/components/sidebar';
import { AppMobileMenus } from './AppMobileMenus';
import { isWindowSmallInclusive } from './components/component_kit/helpers';
import { Footer } from './Footer';
import { SublayoutBanners } from './SublayoutBanners';
import { SublayoutHeader } from './SublayoutHeader';
import useForceRerender from 'hooks/useForceRerender';
import useSidebarStore from 'state/ui/sidebar';

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
  const { menuVisible, mobileMenuName } = useSidebarStore();
  const [isWindowSmall, setIsWindowSmall] = useState(
    isWindowSmallInclusive(window.innerWidth)
  );

  useEffect(() => {
    app.sidebarRedraw.on('redraw', forceRerender);

    return () => {
      app.sidebarRedraw.off('redraw', forceRerender);
    };
  }, [forceRerender]);

  useEffect(() => {
    if (
      localStorage.getItem('dark-mode-state') === 'on' &&
      localStorage.getItem('user-dark-mode-state') === 'on'
    ) {
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
  const showSidebar = menuVisible || !isWindowSmall;

  return (
    <div className="Sublayout">
      <div className="header-and-body-container">
        <SublayoutHeader hideSearch={hideSearch} onMobile={isWindowSmall} />
        <div className="sidebar-and-body-container">
          {showSidebar && <Sidebar />}
          <div className="body-and-sticky-headers-container">
            <SublayoutBanners banner={banner} chain={chain} terms={terms} />

            {isWindowSmallInclusive && mobileMenuName ? (
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
