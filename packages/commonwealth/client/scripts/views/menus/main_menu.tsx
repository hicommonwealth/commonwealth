/* @jsx m */

import m from 'mithril';

import app from 'state';
import { CWMobileMenu } from '../components/component_kit/cw_mobile_menu';
import { MenuItem } from '../components/component_kit/types';

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
    ...((app.activeChainId()
      ? [
          {
            label: 'Create',
            iconLeft: 'plusCircle',
            iconRight: 'chevronRight',
            onclick: () => {
              app.mobileMenu = 'CreateContentMenu';
            },
          },
        ]
      : []) as Array<MenuItem>),
    {
      label: 'Help',
      iconLeft: 'help',
      iconRight: 'chevronRight',
      onclick: () => {
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
            onclick: () => {
              app.mobileMenu = 'NotificationsMenu';
            },
          },
        ]
      : []) as Array<MenuItem>),
  ];
};

export class MainMenu implements m.ClassComponent {
  view() {
    return <CWMobileMenu menuItems={getMainMenuItems()} />;
  }
}
