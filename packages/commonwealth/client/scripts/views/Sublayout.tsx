import 'Sublayout.scss';
import clsx from 'clsx';
import useBrowserWindow from 'hooks/useBrowserWindow';
import useWindowResize from 'hooks/useWindowResize';
import React, { useEffect, useState } from 'react';
import { matchRoutes, useLocation } from 'react-router-dom';
import app from 'state';
import useSidebarStore from 'state/ui/sidebar';
import { SublayoutHeader } from 'views/components/SublayoutHeader';
import { Sidebar } from 'views/components/sidebar';
import contestsGTMGrowlImage from '../../assets/img/contestsGTMGrowlImage.svg';
import useNecessaryEffect from '../hooks/useNecessaryEffect';
import useStickyHeader from '../hooks/useStickyHeader';
import { useAuthModalStore, useWelcomeOnboardModal } from '../state/ui/modals';
import useUserStore from '../state/ui/user';
import { SublayoutBanners } from './SublayoutBanners';
import { AdminOnboardingSlider } from './components/AdminOnboardingSlider';
import { Breadcrumbs } from './components/Breadcrumbs';
import MobileNavigation from './components/MobileNavigation';
import AuthButtons from './components/SublayoutHeader/AuthButtons';
import { CWGrowlTemplate } from './components/SublayoutHeader/GrowlTemplate/CWGrowlTemplate';
import { UserTrainingSlider } from './components/UserTrainingSlider';
import CollapsableSidebarButton from './components/sidebar/CollapsableSidebarButton';
import { AuthModal, AuthModalType } from './modals/AuthModal';
import { WelcomeOnboardModal } from './modals/WelcomeOnboardModal';

type SublayoutProps = {
  hideFooter?: boolean;
  isInsideCommunity?: boolean;
} & React.PropsWithChildren;

const Sublayout = ({ children, isInsideCommunity }: SublayoutProps) => {
  const { menuVisible, setMenu, menuName } = useSidebarStore();
  const [resizing, setResizing] = useState(false);

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

  useNecessaryEffect(() => {
    if (
      user.isLoggedIn &&
      !isWelcomeOnboardModalOpen &&
      user.id &&
      !user.isWelcomeOnboardFlowComplete
    ) {
      setIsWelcomeOnboardModalOpen(true);
    }

    if (!user.isLoggedIn && isWelcomeOnboardModalOpen) {
      setIsWelcomeOnboardModalOpen(false);
    }
  }, [
    user.id,
    isWelcomeOnboardModalOpen,
    setIsWelcomeOnboardModalOpen,
    user.isLoggedIn,
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
  const terms = app.chain ? chain?.terms : null;
  const banner = app.chain ? chain?.communityBanner : null;

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
          <SublayoutBanners banner={banner || ''} terms={terms || ''} />

          <div className="Body">
            <div
              className={clsx('mobile-auth-buttons', {
                isVisible: !user.isLoggedIn && isWindowExtraSmall,
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
          <CWGrowlTemplate
            headerText="Ignite Your Community with Weekly Contests"
            bodyText="Supercharge engagement with real rewards! Common Contests spark
            creativity and bring your community's best ideas to life!"
            buttonText="Learn More"
            buttonLink="https://commonwealth.im/common/discussion/25536-Weighted%20Voting%20and%20Contest%20FAQs"
            growlImage={contestsGTMGrowlImage}
            extraText="Spark creativity and foster connections within your community."
            growlType="contests"
          />
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
