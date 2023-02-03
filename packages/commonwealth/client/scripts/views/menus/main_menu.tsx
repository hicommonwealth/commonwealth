/* @jsx jsx */
import React from 'react';

import {
  ClassComponent,
  ResultNode,
  render,
  setRoute,
  getRoute,
  getRouteParam,
  redraw,
  Component,
  jsx,
} from 'mithrilInterop';

import app from 'state';
import { CWMobileMenu } from '../components/component_kit/cw_mobile_menu';
import type { MenuItem } from '../components/component_kit/types';

export const getMainMenuItems = (): Array<MenuItem> => {
  return [
    // Graham TODO 22.10.05: Reinstate once proper search page built
    // which can take "empty queries" (i.e. doesn't require active search term)
    // {
    //   label: 'Search',
    //   iconName: 'search',
    //   mobileCaret: true,
    //   onClick: () => {
    //     setRoute('/search');
    //   },
    // },
    ...((app.activeChainId()
      ? [
          {
            label: 'Create',
            iconLeft: 'plusCircle',
            iconRight: 'chevronRight',
            onClick: () => {
              app.mobileMenu = 'CreateContentMenu';
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
            },
          },
        ]
      : []) as Array<MenuItem>),
  ];
};

export class MainMenu extends ClassComponent {
  view() {
    return <CWMobileMenu className="MainMenu" menuItems={getMainMenuItems()} />;
  }
}
