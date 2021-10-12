import 'modals/offchain_voting_modal.scss';

import m from 'mithril';
import app from 'state';
import { OffchainThread } from 'models';
import { Button, Input } from 'construct-ui';
import { notifyError } from 'controllers/app/notifications';
import { CompactModalExitButton } from '../modal';

const LinkThreadToThreadModal: m.Component<
  { linkingProposal: OffchainThread },
  { linkedThreadId: number }
> = {
  view: (vnode) => {
    const { linkingProposal } = vnode.attrs;
    return m('.LinkThreadToThreadModal', [
      m('.compact-modal-title', [
        m('h3', 'Link to Existing Threads'),
        m(CompactModalExitButton),
      ]),
      m('.compact-modal-body', [
        m('h3', 'Offchain Threads'),
        m(Input, {
          label: 'Add thread id',
          placeholder: '712',
          oninput: (e) => {
            if (!Number.isInteger(+e.target.value)) {
              notifyError('Can only enter integers');
            } else {
              vnode.state.linkedThreadId = +e.target.value;
              m.redraw();
            }
          },
        }),
        m(Button, {
          label: 'Add',
          onclick: (e) => {
            console.log(vnode.state.linkedThreadId);
            app.threads.addLinkedThread(
              vnode.state.linkedThreadId,
              linkingProposal
            );
          },
        }),
      ]),
    ]);
  },
};

export default LinkThreadToThreadModal;
