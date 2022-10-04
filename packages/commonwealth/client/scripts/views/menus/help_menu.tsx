/* @jsx m */

import m from 'mithril';

import app from 'state';
import { CWMenuItem } from '../components/component_kit/cw_menu_item';
import { FeedbackModal } from '../modals/feedback_modal';

export const getHelpMenuItems = () => {
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
      onclick: () => m.route.set('https://docs.commonwealth.im/commonwealth/'),
    },
  ];
};

export class HelpMenu implements m.ClassComponent {
  view() {
    return (
      <div class="HelpMenu">
        {getHelpMenuItems().map((attrs) => (
          <CWMenuItem {...attrs} />
        ))}
      </div>
    );
  }
}
