import 'Sublayout.scss';
import clsx from 'clsx';
import useBrowserWindow from 'hooks/useBrowserWindow';
import useForceRerender from 'hooks/useForceRerender';
import useWindowResize from 'hooks/useWindowResize';
import React, { useEffect, useState } from 'react';
import app from 'state';
import useSidebarStore from 'state/ui/sidebar';
import { Sidebar } from 'views/components/sidebar';
import { AppMobileMenus } from './AppMobileMenus';
import { Footer } from './Footer';
import { SublayoutBanners } from './SublayoutBanners';
import { SublayoutHeader } from './SublayoutHeader';
import { AdminOnboardingSlider } from './components/AdminOnboardingSlider';
import { Breadcrumbs } from './components/Breadcrumbs';
import { StakeGrowl } from './components/StakeGrowl';
import CollapsableSidebarButton from './components/sidebar/CollapsableSidebarButton';
import MobileNavigation from './composition/MobileNavigation';

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
  const { isWindowSmallInclusive, isWindowExtraSmall } = useBrowserWindow({
    onResize: () => setResizing(true),
    resizeListenerUpdateDeps: [resizing],
  });

  const { toggleMobileView } = useWindowResize({
    setMenu,
  });

  useEffect(() => {
    app.sidebarRedraw.on('redraw', forceRerender);

    return () => {
      app.sidebarRedraw.off('redraw', forceRerender);
    };
  }, [forceRerender]);

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

  const chain = app.chain ? app.chain.meta : null;
  const terms = app.chain ? chain.terms : null;
  const banner = app.chain ? chain.communityBanner : null;

  return (
    <div className="Sublayout">
      {!isWindowSmallInclusive && (
        <CollapsableSidebarButton
          onMobile={isWindowExtraSmall}
          isInsideCommunity={isInsideCommunity}
        />
      )}
      <SublayoutHeader
        onMobile={isWindowExtraSmall}
        isInsideCommunity={isInsideCommunity}
      />
      <div className="sidebar-and-body-container">
        <Sidebar
          isInsideCommunity={isInsideCommunity}
          onMobile={isWindowExtraSmall}
        />
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
              {!toggleMobileView && (
                <div className="breadcrumbContainer">
                  <Breadcrumbs />
                </div>
              )}
              {isInsideCommunity && <AdminOnboardingSlider />}
              {children}
              {!app.isCustomDomain() && !hideFooter && <Footer />}
            </div>
          )}
        </div>
        <StakeGrowl />
      </div>
      {isWindowExtraSmall && <MobileNavigation />}
    </div>
  );
};

export default Sublayout;
