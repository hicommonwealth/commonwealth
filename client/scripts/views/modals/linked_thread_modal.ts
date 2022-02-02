import 'modals/linked_thread_modal.scss';

import m from 'mithril';
import $ from 'jquery';
import { OffchainThread } from 'models';
import { Button } from 'construct-ui';
import { ThreadSelector } from '../components/thread_selector';
import { CompactModalExitButton } from '../components/component_kit/cw_modal';

const LinkedThreadModal: m.Component<
  {
    linkingThread: OffchainThread;
    onclose: () => null;
  },
  {}
> = {
  view: (vnode) => {
    const { linkingThread, onclose } = vnode.attrs;
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
            e.preventDefault();
            if (onclose) onclose();
            $(e.target).trigger('modalexit');
          },
        }),
      ]),
    ]);
  },
};

export default LinkedThreadModal;
