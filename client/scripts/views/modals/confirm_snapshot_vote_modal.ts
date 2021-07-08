import 'modals/confirm_snapshot_vote_modal.scss';

import m from 'mithril';
import app from 'state';
import $ from 'jquery';
import { Button } from 'construct-ui';
import { bufferToHex } from 'ethereumjs-util';

import { _explorer, _n, _shorten } from 'helpers/snapshot_utils/snapshot_utils';
import { notifyError } from 'controllers/app/notifications';

import { CompactModalExitButton } from 'views/modal';

enum NewVoteErrors {
  SomethingWentWrong = 'Something went wrong!'
}

const ConfirmSnapshotVoteModal: m.Component<{
  space,
  proposal,
  id,
  selectedChoice,
  totalScore,
  scores,
  snapshot
}, {
  error: any,
  saving: boolean,
}> = {
  view: (vnode) => {
    const author = app.user.activeAccount;
    const { proposal, space, id, selectedChoice, totalScore, scores, snapshot } = vnode.attrs;

    return m('.ConfirmSnapshotVoteModal', [
      m('.compact-modal-title', [
        m('h3', 'Confirm vote'),
        m(CompactModalExitButton),
      ]),
      m('.compact-modal-body', [
        m('h4', [
          `Are you sure you want to vote "${proposal.msg.payload.choices[selectedChoice]}"?`,
          m('br'),
          'This action cannot be undone.'
        ]),
        m('.vote-info', [
          m('.d-flex', [
            m('span', { class: 'text-blue' }, 'Option'),
            m('span', `${proposal.msg.payload.choices[selectedChoice]}`)
          ]),
          m('.d-flex', [
            m('span', { class: 'text-blue' }, 'Snapshot'),
            m('a', { href: `${_explorer(space.network, proposal.msg.payload.snapshot, 'block')}`, target: '_blank' }, [
              `${_n(proposal.msg.payload.snapshot, '0,0')}`,
              m('i', { class: 'iconexternal-link' })
            ]),
          ]),
          m('.d-flex', [
            m('span', { class: 'text-blue' }, 'Your voting power'),
            m('span', `${_n(totalScore)} ${_shorten(space.symbol, 'symbol')}`)
          ]),
        ]),
        m('.button-group', [
          m(Button, {
            intent: 'none',
            disabled: vnode.state.saving,
            rounded: true,
            onclick: async (e) => {
              e.preventDefault();
              $(e.target).trigger('modalexit');
            },
            label: 'Cancel',
          }),
          m(Button, {
            intent: 'primary',
            disabled: vnode.state.saving,
            rounded: true,
            onclick: async (e) => {
              e.preventDefault();
              vnode.state.saving = true;
              const msg: any = {
                address: author.address,
                msg: JSON.stringify({
                  version: '0.1.3',
                  timestamp: (Date.now() / 1e3).toFixed(),
                  space: space.key,
                  type: 'vote',
                  payload: {
                    proposal: id,
                    choice: selectedChoice + 1,
                    metadata: {}
                  }
                })
              };
              const msgBuffer = bufferToHex(Buffer.from(msg.msg, 'utf8'));

              // TODO: do not use window.ethereum here
              msg.sig = await (window as any).ethereum.request({ method: 'personal_sign', params: [msgBuffer, author.address] });

              const result = await $.post(`${app.serverUrl()}/snapshotAPI/sendMessage`, { ...msg });

              if (result.status === 'Failure') {
                const errorMessage =                  result && result.message.error_description
                  ? `${result.message.error_description}`
                  : NewVoteErrors.SomethingWentWrong;
                notifyError(errorMessage);
              } else if (result.status === 'Success') {
                $(e.target).trigger('modalexit');
                m.route.set(`/${app.activeId()}/snapshot-proposal/${space.key}`);
              }
              vnode.state.saving = false;
            },
            label: 'Vote',
          })
        ])
      ])
    ]);
  }
};

export default ConfirmSnapshotVoteModal;
