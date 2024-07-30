import 'Sublayout.scss';
import clsx from 'clsx';
import useBrowserWindow from 'hooks/useBrowserWindow';
import useForceRerender from 'hooks/useForceRerender';
import useWindowResize from 'hooks/useWindowResize';
import React, { useEffect, useState } from 'react';
import { matchRoutes, useLocation } from 'react-router-dom';
import app from 'state';
import useSidebarStore from 'state/ui/sidebar';
import { SublayoutHeader } from 'views/components/SublayoutHeader';
import { Sidebar } from 'views/components/sidebar';
import useNecessaryEffect from '../hooks/useNecessaryEffect';
import useStickyHeader from '../hooks/useStickyHeader';
import useUserLoggedIn from '../hooks/useUserLoggedIn';
import { useAuthModalStore, useWelcomeOnboardModal } from '../state/ui/modals';
import useUserStore, { userStore } from '../state/ui/user';
import { SublayoutBanners } from './SublayoutBanners';
import { AdminOnboardingSlider } from './components/AdminOnboardingSlider';
import { Breadcrumbs } from './components/Breadcrumbs';
import MobileNavigation from './components/MobileNavigation';
import AuthButtons from './components/SublayoutHeader/AuthButtons';
import { UserTrainingSlider } from './components/UserTrainingSlider';
import CollapsableSidebarButton from './components/sidebar/CollapsableSidebarButton';
import { AuthModal, AuthModalType } from './modals/AuthModal';
import { WelcomeOnboardModal } from './modals/WelcomeOnboardModal';

type SublayoutProps = {
  hideFooter?: boolean;
  isInsideCommunity?: boolean;
} & React.PropsWithChildren;

const Sublayout = ({ children, isInsideCommunity }: SublayoutProps) => {
  const { isLoggedIn } = useUserLoggedIn();
  const forceRerender = useForceRerender();
  const { menuVisible, setMenu, menuName } = useSidebarStore();
  const [resizing, setResizing] = useState(false);
  const [userId, setUserId] = useState<null | number>(null);
  useStickyHeader({
    elementId: 'mobile-auth-buttons',
    stickyBehaviourEnabled: true,
    zIndex: 70,
  });
  const { isWindowSmallInclusive, isWindowExtraSmall } = useBrowserWindow({
    onResize: () => setResizing(true),
    resizeListenerUpdateDeps: [resizing],
  });
  const { authModalType, setAuthModalType } = useAuthModalStore();
  const user = useUserStore();

  const { isWelcomeOnboardModalOpen, setIsWelcomeOnboardModalOpen } =
    useWelcomeOnboardModal();

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    if (isLoggedIn) {
      timeout = setTimeout(() => {
        user.addresses?.[0]?.profile?.userId &&
          setUserId(user.addresses?.[0]?.profile?.userId);
      }, 100);
    } else {
      setUserId(null);
    }

    return () => {
      if (timeout !== null) clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  useNecessaryEffect(() => {
    if (
      isLoggedIn &&
      !isWelcomeOnboardModalOpen &&
      userId &&
      !userStore.getState().isWelcomeOnboardFlowComplete
    ) {
      setIsWelcomeOnboardModalOpen(true);
    }

    if (!isLoggedIn && isWelcomeOnboardModalOpen) {
      setIsWelcomeOnboardModalOpen(false);
    }
  }, [
    userId,
    isWelcomeOnboardModalOpen,
    setIsWelcomeOnboardModalOpen,
    isLoggedIn,
  ]);

  const location = useLocation();

  useWindowResize({
    setMenu,
  });

  const routesWithoutGenericBreadcrumbs = matchRoutes(
    [
      { path: '/discussions/*' },
      { path: ':scope/discussions/*' },
      { path: '/archived' },
      { path: ':scope/archived' },
    ],
    location,
  );

  const routesWithoutGenericSliders = matchRoutes(
    [
      { path: '/discussions/*' },
      { path: ':scope/discussions/*' },
      { path: '/archived' },
      { path: ':scope/archived' },
    ],
    location,
  );

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
  // @ts-expect-error StrictNullChecks
  const terms = app.chain ? chain.terms : null;
  // @ts-expect-error StrictNullChecks
  const banner = app.chain ? chain.communityBanner : null;

  return (
    <div className="Sublayout">
      {!isWindowSmallInclusive && (
        <CollapsableSidebarButton
          onMobile={isWindowExtraSmall}
          // @ts-expect-error StrictNullChecks
          isInsideCommunity={isInsideCommunity}
        />
      )}
      <SublayoutHeader
        onMobile={isWindowExtraSmall}
        // @ts-expect-error StrictNullChecks
        isInsideCommunity={isInsideCommunity}
        onAuthModalOpen={(modalType) =>
          setAuthModalType(modalType || AuthModalType.SignIn)
        }
      />
      <AuthModal
        type={authModalType}
        onClose={() => setAuthModalType(undefined)}
        isOpen={!!authModalType}
      />
      <div className="sidebar-and-body-container">
        <Sidebar
          // @ts-expect-error StrictNullChecks
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
          {/* @ts-expect-error StrictNullChecks */}
          <SublayoutBanners banner={banner} chain={chain} terms={terms} />

          <div className="Body">
            <div
              className={clsx('mobile-auth-buttons', {
                isVisible: !isLoggedIn && isWindowExtraSmall,
              })}
              id="mobile-auth-buttons"
            >
              <AuthButtons
                fullWidthButtons
                onButtonClick={(selectedType) => setAuthModalType(selectedType)}
              />
            </div>
            {!routesWithoutGenericBreadcrumbs && <Breadcrumbs />}
            {!routesWithoutGenericSliders && <UserTrainingSlider />}
            {isInsideCommunity && !routesWithoutGenericSliders && (
              <AdminOnboardingSlider />
            )}
            {children}
          </div>
        </div>
        <WelcomeOnboardModal
          isOpen={isWelcomeOnboardModalOpen}
          onClose={() => setIsWelcomeOnboardModalOpen(false)}
        />
      </div>
      {isWindowExtraSmall && <MobileNavigation />}
    </div>
  );
};

export default Sublayout;
