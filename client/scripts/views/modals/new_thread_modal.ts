import 'modals/new_thread_modal.scss';

import m from 'mithril';
import { NewThreadForm } from 'views/components/new_thread_form';

const NewThreadModal = {
  view: (vnode) => {
    return m('.NewThreadModal', [
      m('.modal-header', [
        m('h3', 'New thread')
      ]),
      m(NewThreadForm, {
        isModal: true,
        header: false,
      }),
    ]);
  }
};

export default NewThreadModal;
