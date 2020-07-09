import 'modals/new_thread_modal.scss';

import m from 'mithril';
import { CompactModalExitButton } from 'views/modal';
import { NewThreadForm } from 'views/components/new_thread_form';

const NewThreadModal = {
  view: (vnode) => {
    return m('.NewThreadModal', [
      m('.compact-modal-title', [
        m('h3', 'New thread'),
        m(CompactModalExitButton),
      ]),
      m('.compact-modal-body-max', [
        m(NewThreadForm, { isModal: true }),
      ]),
    ]);
  }
};

export default NewThreadModal;
