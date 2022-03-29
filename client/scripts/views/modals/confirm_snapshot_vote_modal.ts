import 'modals/confirm_snapshot_vote_modal.scss';

import m from 'mithril';
import app from 'state';
import $ from 'jquery';
import { Button } from 'construct-ui';

import {
  SnapshotProposal,
  SnapshotSpace,
  castVote,
} from 'helpers/snapshot_utils';
import { notifyError } from 'controllers/app/notifications';

import { formatNumberShort } from 'adapters/currency';
import { CompactModalExitButton } from 'views/components/component_kit/cw_modal';

enum NewVoteErrors {
  SomethingWentWrong = 'Something went wrong!',
}

const ConfirmSnapshotVoteModal: m.Component<
  {
    space: SnapshotSpace;
    proposal: SnapshotProposal;
    id: string;
    selectedChoice: string;
    totalScore: number;
    scores: any;
    snapshot: any;
  },
  {
    error: any;
    saving: boolean;
    validAgainstStrategies: boolean;
  }
> = {
  view: (vnode) => {
    const author = app.user.activeAccount;
    const {
      proposal,
      space,
      id,
      selectedChoice,
      totalScore,
      scores,
      snapshot,
    } = vnode.attrs;

    return m('.ConfirmSnapshotVoteModal', [
      m('.compact-modal-title', [
        m('h3', 'Confirm vote'),
        m(CompactModalExitButton),
      ]),
      m('.compact-modal-body', [
        m('h4', [
          `Are you sure you want to vote "${proposal.choices[selectedChoice]}"?`,
          m('br'),
          'This action cannot be undone.',
        ]),
        m('.vote-info', [
          m('.d-flex', [
            m('span', { class: 'text-blue' }, 'Option'),
            m('span', `${proposal.choices[selectedChoice]}`),
          ]),
          // TODO: this links out to the block explorer specific to each space, which we don't hardcode
          // m('.d-flex', [
          //   m('span', { class: 'text-blue' }, 'Snapshot'),
          //   m('a', { href: `${_explorer(space.network, proposal.snapshot, 'block')}`, target: '_blank' }, [
          //     `${formatNumberShort(proposal.snapshot, '0,0')}`,
          //     m('i', { class: 'iconexternal-link' })
          //   ]),
          // ]),
          m('.d-flex', [
            m('span', { class: 'text-blue' }, 'Your voting power'),
            m(
              'span',
              `${formatNumberShort(totalScore)} ${space.symbol
                .slice(0, 6)
                .trim()}...`
            ),
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
              const votePayload = {
                space: space.id,
                proposal: id,
                type: 'single-choice',
                choice: selectedChoice + 1,
                metadata: JSON.stringify({}),
              };
              try {
                castVote(author.address, votePayload).then(() => {
                  $(e.target).trigger('modalexit');
                  m.redraw();
                });
              } catch (e) {
                console.log(e);
                const errorMessage = e.message;
                notifyError(errorMessage);
              }

              vnode.state.saving = false;
            },
            label: 'Vote',
          }),
        ]),
      ]),
    ]);
  },
};

export default ConfirmSnapshotVoteModal;
