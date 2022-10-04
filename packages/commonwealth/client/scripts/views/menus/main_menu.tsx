/* @jsx m */

import app from 'state';
import m from 'mithril';
import {
  CWMenuItem,
  MenuItemAttrs,
} from '../components/component_kit/cw_menu_item';

export const getMainMenuItems = (): MenuItemAttrs[] => {
  return [
    {
      label: 'Create',
      iconName: 'plus-circle',
      onclick: () => {
        app.mobileMenu = 'createContent';
      },
    },
    {
      label: 'Help',
      iconName: 'help-circle',
      onclick: () => {
        app.mobileMenu = 'help';
      },
    },
    {
      label: 'Notifications',
      iconName: 'bell',
      onclick: () => {
        app.mobileMenu = 'notifications';
      },
    },
  ];
};

export class MainMenu implements m.ClassComponent {
  view() {
    return (
      <div class="MainMenu">
        {getMainMenuItems().map((attrs) => (
          <CWMenuItem {...attrs} />
        ))}
      </div>
    );
  }
}
