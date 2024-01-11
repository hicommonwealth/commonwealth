import clsx from 'clsx';
import useBrowserWindow from 'hooks/useBrowserWindow';
import useForceRerender from 'hooks/useForceRerender';
import React, { useEffect, useState } from 'react';
import app from 'state';
import useSidebarStore from 'state/ui/sidebar';
import { SublayoutHeader } from 'views/SublayoutHeader';
import { AdminOnboardingSlider } from 'views/components/AdminOnboardingSlider';
import GatingGrowl from 'views/components/GatingGrowl/GatingGrowl';
import { Sidebar } from 'views/components/sidebar';
import './POCLayout.scss';

type SubLayoutProps = {
  children: React.ReactNode;
  isInsideCommunity: boolean;
  hideFooter?: boolean;
};

const POCLayout: React.FC<SubLayoutProps> = ({
  children,
  isInsideCommunity,
  hideFooter,
}) => {
  const forceRerender = useForceRerender();
  const [resizing, setResizing] = useState(false);
  const { menuVisible, mobileMenuName, setMenu, menuName } = useSidebarStore();
  const { isWindowSmallInclusive } = useBrowserWindow({
    onResize: () => setResizing(true),
    resizeListenerUpdateDeps: [resizing],
  });

  const chain = app.chain ? app.chain.meta : null;
  const terms = app.chain ? chain.terms : null;
  const banner = app.chain ? chain.communityBanner : null;

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
  return (
    <>
      <SublayoutHeader onMobile={isWindowSmallInclusive} />
      <div className="Sublayout">
        <div>
          <Sidebar isInsideCommunity />
        </div>
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
          <div className="Body">
            {isInsideCommunity && <AdminOnboardingSlider />}
            {children}
          </div>
        </div>
      </div>
      {isInsideCommunity && <GatingGrowl />}
    </>
  );
};

export default POCLayout;
