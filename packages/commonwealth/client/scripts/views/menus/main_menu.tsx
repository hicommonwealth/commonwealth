import React from 'react';

import app from 'state';
import { CWMobileMenu } from '../components/component_kit/cw_mobile_menu';
import type { MenuItem } from '../components/component_kit/types';
import useSidebarStore from 'state/ui/sidebar';
import { MobileMenuName } from 'views/AppMobileMenus';
import { useCommonNavigate } from 'navigation/helpers';
import { NavigateOptions, To } from 'react-router';

export const getMainMenuItems = (
  setMobileMenuName: (name: MobileMenuName) => void,
  navigate: (url: To, options?: NavigateOptions, prefix?: null | string) => void
): Array<MenuItem> => {
  return [
    ...((app.activeChainId()
      ? [
          {
            label: 'Create',
            iconLeft: 'plusCirclePhosphor',
            iconRight: 'chevronRight',
            onClick: () => setMobileMenuName('CreateContentMenu'),
          },
        ]
      : []) as Array<MenuItem>),
    {
      label: 'Explore communities',
      iconLeft: 'compassPhosphor',
      onClick: () => navigate('/communities', {}, null),
    },
    {
      label: 'Help',
      iconLeft: 'question',
      onClick: () => window.open('https://docs.commonwealth.im/commonwealth/'),
    },
    ...((app.isLoggedIn()
      ? [
          {
            label: 'Notifications',
            iconLeft: 'bell',
            iconRight: 'chevronRight',
            type: 'notification',
            hasUnreads: !!app.user?.notifications.numUnread,
            onClick: () => setMobileMenuName('NotificationsMenu'),
          },
        ]
      : []) as Array<MenuItem>),
  ];
};

export const MainMenu = () => {
  const { setMobileMenuName } = useSidebarStore();
  const navigate = useCommonNavigate();

  return (
    <CWMobileMenu
      className="MainMenu"
      menuItems={getMainMenuItems(setMobileMenuName, navigate)}
    />
  );
};
