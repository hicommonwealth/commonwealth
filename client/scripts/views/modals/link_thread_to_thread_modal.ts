import 'modals/offchain_voting_modal.scss';

import m from 'mithril';
import { OffchainVote } from 'models';
import app from 'state';
import { CompactModalExitButton } from '../modal';

const addLinkedThread = async (
  linked_thread_id: number,
  linking_thread_id: number
): Promise<boolean> => {
  const response = await $.post(`${app.serverUrl()}/updateLinkedThreads`, {
    linked_thread: linked_thread_id,
    linking_thread: linking_thread_id,
  });
  if (response.status !== 'Success') {
    return false;
  }
};

const LinkThreadToThreadModal: m.Component<{ votes: OffchainVote[] }, {}> = {
  view: (vnode) => {
    return m('.LinkThreadToThreadModal', [
      m('.compact-modal-title', [
        m('h3', 'Link to Existing Threads'),
        m(CompactModalExitButton),
      ]),
      m('.compact-modal-body', 'Offchain Threads'),
    ]);
  },
};

export default LinkThreadToThreadModal;
