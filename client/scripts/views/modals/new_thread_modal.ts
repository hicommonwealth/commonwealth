import 'modals/new_thread_modal.scss';

import $ from 'jquery';
import m from 'mithril';
import { NewThreadForm } from 'views/components/new_thread_form';

const NewThreadModal = {
  view: (vnode) => {
    $(vnode.dom).on('modalexit modalforceexit modalcomplete', () => {
      console.log(vnode);
      console.log('heya exit')
    });
    return m('.NewThreadModal', [
      m(NewThreadForm, {
        isModal: true,
        header: true
      }),
    ]);
  }
};

export default NewThreadModal;
