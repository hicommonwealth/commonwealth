import useBrowserWindow from 'hooks/useBrowserWindow';
import useForceRerender from 'hooks/useForceRerender';
import React, { useEffect } from 'react';
import app from 'state';
import useSidebarStore from 'state/ui/sidebar';
import 'Sublayout.scss';
import { Sidebar } from 'views/components/sidebar';
import { AppMobileMenus } from './AppMobileMenus';
import { Footer } from './Footer';
import { SublayoutBanners } from './SublayoutBanners';
import { SublayoutHeader } from './SublayoutHeader';

type SublayoutProps = {
  hideFooter?: boolean;
  hasCommunitySidebar?: boolean;
} & React.PropsWithChildren;

const Sublayout = ({
  children,
  hideFooter = true,
  hasCommunitySidebar,
}: SublayoutProps) => {
  const forceRerender = useForceRerender();
  const { menuVisible, mobileMenuName } = useSidebarStore();
  const { isWindowSmallInclusive } = useBrowserWindow({});

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
  }, []);

  const chain = app.chain ? app.chain.meta : null;
  const terms = app.chain ? chain.terms : null;
  const banner = app.chain ? chain.communityBanner : null;
  const showSidebar = menuVisible || !isWindowSmallInclusive;

  return (
    <div className="Sublayout">
      <div className="header-and-body-container">
        <SublayoutHeader onMobile={isWindowSmallInclusive} />
        <div className="sidebar-and-body-container">
          {showSidebar && <Sidebar isInsideCommunity={hasCommunitySidebar} />}
          <div className="body-and-sticky-headers-container">
            <SublayoutBanners banner={banner} chain={chain} terms={terms} />

            {isWindowSmallInclusive && mobileMenuName ? (
              <AppMobileMenus />
            ) : (
              <div className="Body">
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
