import React, { useState } from 'react';
import { matchRoutes, useLocation } from 'react-router-dom';

import { useCommonNavigate } from 'navigation/helpers';
import CWDrawer from 'views/components/component_kit/new_designs/CWDrawer';

import CreateContentDrawer from './CreateContentDrawer';
import NavigationButton, { NavigationButtonProps } from './NavigationButton';

import './MobileNavigation.scss';

const MobileNavigation = () => {
  const navigate = useCommonNavigate();
  const location = useLocation();

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
    {
      type: 'create',
      onClick: () => setIsDrawerOpen(true),
      selected: false,
    },
    {
      type: 'explore',
      onClick: () => navigate('/communities', {}, null),
      selected: !!matchesExplore,
    },
    {
      type: 'notifications',
      onClick: () => navigate('/notifications', {}, null),
      selected: !!matchesNotifications,
    },
  ];

  return (
    <>
      <div className="MobileNavigation">
        {navigationConfig.map(({ type, selected, onClick }) => (
          <NavigationButton
            key={type}
            type={type}
            selected={selected}
            onClick={onClick}
          />
        ))}
      </div>
      <CWDrawer
        size="200px"
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
