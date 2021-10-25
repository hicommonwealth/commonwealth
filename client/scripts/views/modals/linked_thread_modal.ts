import 'modals/linked_thread_modal.scss';

import m from 'mithril';
import { OffchainThread } from 'models';
import { Button } from 'construct-ui';
import { CompactModalExitButton } from '../modal';
import { ThreadSelector } from '../components/thread_selector';

const LinkedThreadModal: m.Component<{ linkingThread: OffchainThread }, {}> = {
  view: (vnode) => {
    const { linkingThread } = vnode.attrs;
    return m('.LinkedThreadModal', [
      m('.compact-modal-title', [
        m('h3', 'Link to Existing Threads'),
        m(CompactModalExitButton),
      ]),
      m('.compact-modal-body', [
        m(ThreadSelector, {
          linkingThread,
        }),
        m(Button, {
          label: 'Close',
          intent: 'primary',
          onclick: (e) => {
            $(e.target).trigger('modalcomplete');
          },
        }),
      ]),
    ]);
  },
};

export default LinkedThreadModal;
