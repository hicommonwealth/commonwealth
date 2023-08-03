import useBrowserWindow from 'hooks/useBrowserWindow';
import useForceRerender from 'hooks/useForceRerender';
import React, { useEffect, useRef, useState } from 'react';
import app from 'state';
import useSidebarStore from 'state/ui/sidebar';
import 'Sublayout.scss';
import { Sidebar } from 'views/components/sidebar';
import { AppMobileMenus } from './AppMobileMenus';
import { Footer } from './Footer';
import { SublayoutBanners } from './SublayoutBanners';
import { SublayoutHeader } from './SublayoutHeader';
import { SublayoutMobileFooter } from './SublayoutMobileFooter';

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
  const { menuVisible, mobileMenuName, userToggledVisibility } =
    useSidebarStore();
  const [resizing, setResizing] = useState(false);
  const { isWindowSmallInclusive } = useBrowserWindow({
    onResize: () => setResizing(true),
    resizeListenerUpdateDeps: [resizing],
  });
  const { setMenu } = useSidebarStore();

  useEffect(() => {
    app.sidebarRedraw.on('redraw', forceRerender);

    return () => {
      app.sidebarRedraw.off('redraw', forceRerender);
    };
  }, [forceRerender]);

  useEffect(() => {
    let timer;
    if (resizing) {
      timer = setTimeout(() => {
        setResizing(false);
      }, 200); // adjust delay as needed
    }
    return () => {
      clearTimeout(timer);
    };
  }, [resizing]);

  useEffect(() => {
    if (
      localStorage.getItem('dark-mode-state') === 'on' &&
      localStorage.getItem('user-dark-mode-state') === 'on'
    ) {
      document.getElementsByTagName('html')[0].classList.add('invert');
    }

    const onResize = () => {
      if (userToggledVisibility === null) {
        setMenu({ name: 'default', isVisible: !isWindowSmallInclusive });
      }
    };

    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
    };
  }, []);

  const chain = app.chain ? app.chain.meta : null;
  const terms = app.chain ? chain.terms : null;
  const banner = app.chain ? chain.communityBanner : null;
  const showSidebar = menuVisible;

  // Hide Footer on Scroll Code (not sure we want)

  // const [showFooter, setShowFooter] = useState(true);
  // const lastScrollTop = useRef(0);
  // const scrollThreshold = useRef(0.15); // 15% of the div height (will be calculated later)
  const divRef = useRef(null);

  // // Mobile Footer Scroll Behavior
  // const onScroll = () => {
  //   const st = divRef.current.scrollTop;
  //   const divHeight = divRef.current.offsetHeight;
  //   scrollThreshold.current = divHeight * 0.15;

  //   if (Math.abs(st - lastScrollTop.current) >= scrollThreshold.current) {
  //     // Only change component visibility if scroll distance >= threshold
  //     if (st > lastScrollTop.current) {
  //       // downscroll
  //       setShowFooter(false);
  //     } else {
  //       // upscroll
  //       setShowFooter(true);
  //     }
  //     lastScrollTop.current = st <= 0 ? 0 : st;
  //   }
  // };

  // useEffect(() => {
  //   const div = divRef.current;
  //   if (div) {
  //     div.addEventListener('scroll', onScroll);
  //     return () => {
  //       div.removeEventListener('scroll', onScroll);
  //     };
  //   }
  // }, []);

  return (
    <div className="Sublayout">
      <div className="header-and-body-container">
        <SublayoutHeader onMobile={isWindowSmallInclusive} />
        <div className="sidebar-and-body-container">
          {showSidebar && <Sidebar isInsideCommunity={hasCommunitySidebar} />}
          <div
            className={`body-and-sticky-headers-container 
            ${menuVisible ? 'menu-visible' : ''} 
            ${resizing ? 'resizing' : ''}`}
          >
            <SublayoutBanners banner={banner} chain={chain} terms={terms} />

            {isWindowSmallInclusive && mobileMenuName ? (
              <AppMobileMenus />
            ) : (
              <div className="Body" ref={divRef}>
                {children}
                {!app.isCustomDomain() && !hideFooter && <Footer />}
              </div>
            )}
          </div>
        </div>
        {<SublayoutMobileFooter />}
      </div>
    </div>
  );
};

export default Sublayout;
