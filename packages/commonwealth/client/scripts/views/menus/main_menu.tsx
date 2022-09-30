/* @jsx m */

import app from 'state';
import m from 'mithril';

const getMainMenu = () => {
  return [
    {
      label: 'Create',
      iconName: 'plusCircle',
      onclick: () => {
        app.mobileMenu = 'createContent';
      },
    },
    {
      label: 'Help',
      iconName: 'help',
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
    return <>{getMainMenu()}</>;
  }
}
