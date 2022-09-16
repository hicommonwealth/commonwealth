/* @jsx m */

import m from 'mithril';

import 'modals/new_thread_modal.scss';

import app from 'state';
import { NewThreadForm } from 'views/components/new_thread_form/new_thread_form';
import { ModalExitButton } from 'views/components/component_kit/cw_modal';

class NewThreadModal implements m.ClassComponent {
  view() {
    const hasTopics = !!app.topics.getByCommunity(app.chain.id).length;

    return (
      <div class="NewThreadModal">
        <div class="compact-modal-title">
          <h3>New thread</h3>
          <ModalExitButton />
        </div>
        <NewThreadForm isModal hasTopics={hasTopics} />
      </div>
    );
  }
}

export default NewThreadModal;
