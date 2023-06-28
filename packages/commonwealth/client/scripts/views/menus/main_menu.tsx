import React from 'react';

import app from 'state';
import { CWMobileMenu } from '../components/component_kit/cw_mobile_menu';
import type { MenuItem } from '../components/component_kit/types';
import useSidebarStore from 'state/ui/sidebar';
import { MobileMenuName } from 'views/AppMobileMenus';

export const getMainMenuItems = (
  setMobileMenuName: (name: MobileMenuName) => void
): Array<MenuItem> => {
  return [
    ...((app.activeChainId()
      ? [
          {
            label: 'Create',
            iconLeft: 'plusCircle',
            iconRight: 'chevronRight',
            onClick: () => setMobileMenuName('CreateContentMenu'),
          },
        ]
      : []) as Array<MenuItem>),
    {
      label: 'Help',
      iconLeft: 'help',
      iconRight: 'chevronRight',
      onClick: () => setMobileMenuName('HelpMenu'),
    },
    ...((app.isLoggedIn()
      ? [
          {
            label: 'Notifications',
            iconLeft: 'bell',
            iconRight: 'chevronRight',
            type: 'notification',
            // we temporarily will not support unread vs read notification functionality
            hasUnreads: false,
            onClick: () => setMobileMenuName('NotificationsMenu'),
          },
        ]
      : []) as Array<MenuItem>),
  ];
};

export const MainMenu = () => {
  const { setMobileMenuName } = useSidebarStore();

  return (
    <CWMobileMenu
      className="MainMenu"
      menuItems={getMainMenuItems(setMobileMenuName)}
    />
  );
};
