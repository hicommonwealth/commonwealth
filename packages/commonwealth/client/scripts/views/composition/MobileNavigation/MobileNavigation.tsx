import React from 'react';
import { matchRoutes, useLocation } from 'react-router-dom';

import { useCommonNavigate } from 'navigation/helpers';

import NavigationButton, { NavigationButtonProps } from './NavigationButton';

import './MobileNavigation.scss';

const MobileNavigation = () => {
  const navigate = useCommonNavigate();
  const location = useLocation();

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
      onClick: () => console.log('open create navigation'),
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
  );
};

export default MobileNavigation;
