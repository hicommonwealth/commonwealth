/* eslint-disable @typescript-eslint/ban-types */
import 'modals/new_thread_modal.scss';

import m from 'mithril';

import app from 'state';
import { NewThreadForm } from 'client/scripts/views/components/new_thread_form/new_thread_form';
import { ModalExitButton } from 'views/components/component_kit/cw_modal';

const NewThreadModal: m.Component<{}> = {
  view: (vnode) => {
    const hasTopics = !!app.chain?.meta.topics.length;
    return m('.NewThreadModal', [
      m('.compact-modal-title', [m('h3', 'New thread'), m(ModalExitButton)]),
      m('.compact-modal-body-max', [
        m(NewThreadForm, { isModal: true, hasTopics }),
      ]),
    ]);
  },
};

export default NewThreadModal;
