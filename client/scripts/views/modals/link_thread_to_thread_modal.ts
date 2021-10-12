import 'modals/offchain_voting_modal.scss';

import m from 'mithril';
import { OffchainVote } from 'models';
import { CompactModalExitButton } from '../modal';

const LinkThreadToThreadModal: m.Component<{ votes: OffchainVote[] }, {}> = {
  view: (vnode) => {
    const { votes } = vnode.attrs;
    if (!votes || votes.length === 0) return;

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
