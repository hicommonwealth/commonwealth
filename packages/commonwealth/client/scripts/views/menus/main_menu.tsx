/* @jsx m */

import m from 'mithril';

import app from 'state';
import { IconName } from '../components/component_kit/cw_icons/cw_icon_lookup';
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
    ...(app.activeChainId()
      ? [
          {
            label: 'Create',
            iconLeft: 'plusCircle' as IconName,
            iconRight: 'chevronRight' as IconName,
            onclick: () => {
              app.mobileMenu = 'CreateContentMenu';
            },
          },
        ]
      : []),
    {
      label: 'Help',
      iconLeft: 'help' as IconName,
      iconRight: 'chevronRight' as IconName,
      onclick: () => {
        app.mobileMenu = 'HelpMenu';
      },
    },
    ...(app.isLoggedIn()
      ? [
          {
            label: 'Notifications',
            iconLeft: 'bell' as IconName,
            iconRight: 'chevronRight' as IconName,
            type: 'notification' as const,
            hasUnreads: !!app.user?.notifications.numUnread,
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
