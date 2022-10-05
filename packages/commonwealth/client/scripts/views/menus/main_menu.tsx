/* @jsx m */

import app from 'state';
import m from 'mithril';
import { MenuItemAttrs } from './types';
import { CWMobileMenu } from '../components/component_kit/cw_mobile_menu';
import { IconName } from '../components/component_kit/cw_icons/cw_icon_lookup';

export const getMainMenuItemAttrs = (): MenuItemAttrs[] => {
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
              app.mobileMenu = 'createContent';
            },
          },
        ]
      : []),
    {
      label: 'Help',
      iconName: 'help',
      mobileCaret: true,
      onclick: () => {
        app.mobileMenu = 'help';
      },
    },
    {
      label: 'Notifications',
      iconName: 'bell',
      mobileCaret: true,
      onclick: () => {
        app.mobileMenu = 'notifications';
      },
    },
  ];
};

export class MainMenu implements m.ClassComponent {
  view() {
    return (
      <CWMobileMenu className="MainMenu" menuItems={getMainMenuItemAttrs()} />
    );
  }
}
