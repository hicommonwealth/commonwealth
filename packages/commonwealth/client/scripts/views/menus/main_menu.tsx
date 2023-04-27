import React from 'react';

import app from 'state';
import { CWMobileMenu } from '../components/component_kit/cw_mobile_menu';
import type { MenuItem } from '../components/component_kit/types';

export const getMainMenuItems = (): Array<MenuItem> => {
  return [
    ...((app.activeChainId()
      ? [
          {
            label: 'Create',
            iconLeft: 'plusCircle',
            iconRight: 'chevronRight',
            onClick: () => {
              app.mobileMenu = 'CreateContentMenu';
              app.sidebarRedraw.emit('redraw');
            },
          },
        ]
      : []) as Array<MenuItem>),
    {
      label: 'Help',
      iconLeft: 'help',
      iconRight: 'chevronRight',
      onClick: () => {
        app.mobileMenu = 'HelpMenu';
        app.sidebarRedraw.emit('redraw');
      },
    },
    ...((app.isLoggedIn()
      ? [
          {
            label: 'Notifications',
            iconLeft: 'bell',
            iconRight: 'chevronRight',
            type: 'notification',
            hasUnreads: !!app.user?.notifications.numUnread,
            onClick: () => {
              app.mobileMenu = 'NotificationsMenu';
              app.sidebarRedraw.emit('redraw');
            },
          },
        ]
      : []) as Array<MenuItem>),
  ];
};

export const MainMenu = () => {
  return <CWMobileMenu className="MainMenu" menuItems={getMainMenuItems()} />;
};
