/* @jsx m */

import m from 'mithril';

import app from 'state';
import { FeedbackModal } from '../modals/feedback_modal';
import { CWMenuItem } from '../components/component_kit/cw_menu_item';

export class HelpMenu implements m.ClassComponent {
  view() {
    return (
      <>
        <CWMenuItem
          label="Send Feedback"
          onclick={() => app.modals.create({ modal: FeedbackModal })}
        />
        <CWMenuItem type="divider" />
        <CWMenuItem
          label="Help"
          onclick={() =>
            m.route.set('https://docs.commonwealth.im/commonwealth/')
          }
        />
      </>
    );
  }
}
