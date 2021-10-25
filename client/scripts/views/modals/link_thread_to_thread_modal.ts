import 'modals/offchain_voting_modal.scss';

import m from 'mithril';
import { OffchainThread } from 'models';
import { CompactModalExitButton } from '../modal';
import { ThreadsSelector } from '../components/linked_threads_editor';

const LinkThreadToThreadModal: m.Component<
  { linkingThread: OffchainThread },
  {
  }
> = {
  view: (vnode) => {
    const { linkingThread } = vnode.attrs;
    return m('.LinkThreadToThreadModal', [
      m('.compact-modal-title', [
        m('h3', 'Link to Existing Threads'),
        m(CompactModalExitButton),
      ]),
      m('.compact-modal-body', [
        m(ThreadsSelector, {
          linkingThread,
        }),
      ]),
    ]);
  },
};

export default LinkThreadToThreadModal;