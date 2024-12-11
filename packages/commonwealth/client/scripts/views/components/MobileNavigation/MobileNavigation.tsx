import React, { useState } from 'react';
import { matchRoutes, useLocation } from 'react-router-dom';

import { useCommonNavigate } from 'navigation/helpers';
import { SUPPORTED_LANGUAGES } from 'state/ui/language/constants';
import { languageStore } from 'state/ui/language/language';
import useUserStore from 'state/ui/user';
import CWDrawer from 'views/components/component_kit/new_designs/CWDrawer';

import CreateContentDrawer from './CreateContentDrawer';
import NavigationButton, { NavigationButtonProps } from './NavigationButton';

import { useFlag } from 'hooks/useFlag';
import { QuickPostButton } from 'views/components/MobileNavigation/QuickPostButton';
import './MobileNavigation.scss';

const MobileNavigation = () => {
  const navigate = useCommonNavigate();
  const location = useLocation();
  const user = useUserStore();
  const newMobileNav = useFlag('newMobileNav');

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const matchesDashboard = matchRoutes([{ path: '/dashboard/*' }], location);
  const matchesExplore = matchRoutes([{ path: '/communities' }], location);
  const matchesNotifications = matchRoutes(
    [{ path: '/notifications' }],
    location,
  );

  const navigationConfig: NavigationButtonProps[] = [
    {
      type: 'home',
      onClick: () => navigate('/dashboard', {}, null),
      selected: !!matchesDashboard,
    },
    ...(user.isLoggedIn && !newMobileNav
      ? [
          {
            type: 'create' as const,
            onClick: () => setIsDrawerOpen(true),
            selected: false,
          },
        ]
      : []),
    {
      type: 'explore',
      onClick: () => navigate('/communities', {}, null),
      selected: !!matchesExplore,
    },
    ...(user.isLoggedIn
      ? [
          {
            type: 'notifications' as const,
            onClick: () => navigate('/notifications', {}, null),
            selected: !!matchesNotifications,
          },
        ]
      : []),
    {
      type: 'language' as const,
      onClick: () => {
        const currentLanguage = languageStore.getState().currentLanguage;
        const languages = Object.entries(SUPPORTED_LANGUAGES);
        const currentIndex = languages.findIndex(
          ([code]) => code === currentLanguage,
        );
        const nextIndex = (currentIndex + 1) % languages.length;
        languageStore
          .getState()
          .setLanguage(
            languages[nextIndex][0] as keyof typeof SUPPORTED_LANGUAGES,
          );
      },
      selected: false,
    },
  ];

  return (
    <>
      {newMobileNav && <QuickPostButton />}
      <div className="MobileNavigation">
        <div id="MobileNavigationHead">
          {/*react portal container for anyone that wants to put content*/}
          {/*into the bottom nav.*/}
        </div>

        <div className="MobileNavigationInner">
          {navigationConfig.map(({ type, selected, onClick }) => (
            <NavigationButton
              key={type}
              type={type}
              selected={selected}
              onClick={onClick}
            />
          ))}
        </div>
      </div>
      <CWDrawer
        size="auto"
        direction="bottom"
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      >
        <CreateContentDrawer onClose={() => setIsDrawerOpen(false)} />
      </CWDrawer>
    </>
  );
};

export default MobileNavigation;
