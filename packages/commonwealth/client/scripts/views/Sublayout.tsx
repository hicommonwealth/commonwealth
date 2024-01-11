import 'Sublayout.scss';
import clsx from 'clsx';
import useBrowserWindow from 'hooks/useBrowserWindow';
import useForceRerender from 'hooks/useForceRerender';
import React, { useEffect, useState } from 'react';
import app from 'state';
import useSidebarStore from 'state/ui/sidebar';
import { Sidebar } from 'views/components/sidebar';
import { AppMobileMenus } from './AppMobileMenus';
import { Footer } from './Footer';
import { SublayoutBanners } from './SublayoutBanners';
import { SublayoutHeader } from './SublayoutHeader';
import { AdminOnboardingSlider } from './components/AdminOnboardingSlider';
import GatingGrowl from './components/GatingGrowl/GatingGrowl';

type SublayoutProps = {
  hideFooter?: boolean;
  isInsideCommunity?: boolean;
} & React.PropsWithChildren;

const Sublayout = ({
  children,
  hideFooter = true,
  isInsideCommunity,
}: SublayoutProps) => {
  const forceRerender = useForceRerender();
  const { menuVisible, mobileMenuName, setMenu, menuName } = useSidebarStore();
  const [resizing, setResizing] = useState(false);
  const { isWindowSmallInclusive } = useBrowserWindow({
    onResize: () => setResizing(true),
    resizeListenerUpdateDeps: [resizing],
  });

  useEffect(() => {
    app.sidebarRedraw.on('redraw', forceRerender);

    return () => {
      app.sidebarRedraw.off('redraw', forceRerender);
    };
  }, [forceRerender]);

  useEffect(() => {
    setMenu({ name: 'default', isVisible: !isWindowSmallInclusive });
  }, [isWindowSmallInclusive, setMenu]);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (resizing) {
      timer = setTimeout(() => {
        setResizing(false);
      }, 200); // Adjust delay as needed
    }

    return () => {
      clearTimeout(timer);
    };
  }, [resizing]);

  useEffect(() => {
    const onResize = () => {
      setMenu({ name: 'default', isVisible: !isWindowSmallInclusive });
    };

    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
    };
  }, [isWindowSmallInclusive, menuVisible, mobileMenuName, setMenu]);

  const chain = app.chain ? app.chain.meta : null;
  const terms = app.chain ? chain.terms : null;
  const banner = app.chain ? chain.communityBanner : null;

  return (
    <div className="Sublayout">
      <div className="header-and-body-container">
        <SublayoutHeader onMobile={isWindowSmallInclusive} />
        <div className="sidebar-and-body-container">
          <Sidebar isInsideCommunity={isInsideCommunity} />
          <div
            className={clsx(
              'body-and-sticky-headers-container',
              {
                'menu-visible': menuVisible,
                'menu-hidden': !menuVisible,
                'quick-switcher-visible':
                  menuName === 'exploreCommunities' ||
                  menuName === 'createContent' ||
                  isInsideCommunity,
              },
              resizing,
            )}
          >
            <SublayoutBanners banner={banner} chain={chain} terms={terms} />

            {isWindowSmallInclusive && mobileMenuName ? (
              <AppMobileMenus />
            ) : (
              <div className="Body">
                {isInsideCommunity && <AdminOnboardingSlider />}
                {children}
                {!app.isCustomDomain() && !hideFooter && <Footer />}
              </div>
            )}
          </div>
        </div>
        {isInsideCommunity && <GatingGrowl />}
      </div>
    </div>
  );
};

export default Sublayout;
