/* @jsx m */

import m from 'mithril';

import app from 'state';
import { FeedbackModal } from '../modals/feedback_modal';

const getHelpMenu = () => {
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
    return <>{getHelpMenu()}</>;
  }
}
