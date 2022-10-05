/* @jsx m */

import m from 'mithril';

import app from 'state';
import { CWMobileMenu } from '../components/component_kit/cw_mobile_menu';
import { FeedbackModal } from '../modals/feedback_modal';
import { MenuItemAttrs } from './types';

export const getHelpMenuItemAttrs = (): MenuItemAttrs[] => {
  return [
    {
      label: 'Send Feedback',
      onclick: () => app.modals.create({ modal: FeedbackModal }),
    },
    {
      type: 'divider',
    },
    {
      label: 'Help',
      onclick: () => window.open('https://docs.commonwealth.im/commonwealth/'),
    },
  ];
};

export class HelpMenu implements m.ClassComponent {
  view() {
    return (
      <CWMobileMenu className="HelpMenu" menuItems={getHelpMenuItemAttrs()} />
    );
  }
}
