import m from 'mithril';

import 'modals/new_thread_modal.scss';

import app from 'state';
import { NewThreadForm } from 'views/components/new_thread_form/new_thread_form';
import { ModalExitButton } from 'views/components/component_kit/cw_modal';

class NewThreadModal implements m.ClassComponent {
  view() {
    const hasTopics = !!app.chain?.meta.topics.length;

    return (
      <div class="NewThreadModal">
        <div class="compact-modal-title">
          <h3>New thread</h3>
          <ModalExitButton />
        </div>
        <div class="compact-modal-body-max">
          <NewThreadForm isModal hasTopics={hasTopics} />,
        </div>
      </div>
    );
  }
}

export default NewThreadModal;
