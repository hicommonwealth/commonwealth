/* @jsx m */

import m from 'mithril';

import app from 'state';
import { CWMobileMenu } from '../components/component_kit/cw_mobile_menu';
import { IconName } from '../components/component_kit/cw_icons/cw_icon_lookup';
import { MenuItem } from './types';

export const getMainMenuItems = (): Array<MenuItem> => {
  return [
    // Graham TODO 22.10.05: Reinstate once proper search page built
    // which can take "empty queries" (i.e. doesn't require active search term)
    // {
    //   label: 'Search',
    //   iconName: 'search',
    //   mobileCaret: true,
    //   onclick: () => {
    //     m.route.set('/search');
    //   },
    // },
    ...(app.activeChainId()
      ? [
          {
            label: 'Create',
            iconName: 'plusCircle' as IconName,
            mobileCaret: true,
            onclick: () => {
              app.mobileMenu = 'CreateContentMenu';
            },
          },
        ]
      : []),
    {
      label: 'Help',
      iconName: 'help',
      mobileCaret: true,
      onclick: () => {
        app.mobileMenu = 'HelpMenu';
      },
    },
    ...(app.isLoggedIn()
      ? [
          {
            label: 'Notifications',
            mobileCaret: true,
            iconName: 'bell' as const,
            type: 'notification' as const,
            unreadNotifications: !!app.user?.notifications.numUnread,
            onclick: () => {
              app.mobileMenu = 'NotificationsMenu';
            },
          },
        ]
      : []),
  ];
};

export class MainMenu implements m.ClassComponent {
  view() {
    return <CWMobileMenu menuItems={getMainMenuItems()} />;
  }
}
