/* @jsx m */

import m from 'mithril';
import $ from 'jquery';
import { Button } from 'construct-ui';

import 'modals/confirm_snapshot_vote_modal.scss';

import app from 'state';
import {
  SnapshotProposal,
  SnapshotSpace,
  castVote,
} from 'helpers/snapshot_utils';
import { notifyError } from 'controllers/app/notifications';
import { formatNumberShort } from 'adapters/currency';
import { CompactModalExitButton } from 'views/components/component_kit/cw_modal';
import { MixpanelSnapshotEvents } from 'analytics/types';
import { mixpanelBrowserTrack } from '../../helpers/mixpanel_browser_util';

type ConfirmSnapshotVoteModalAttrs = {
  id: string;
  proposal: SnapshotProposal;
  scores: any;
  selectedChoice: string;
  snapshot: any;
  space: SnapshotSpace;
  totalScore: number;
};

export class ConfirmSnapshotVoteModal
  implements m.Component<ConfirmSnapshotVoteModalAttrs>
{
  private error: any;
  private saving: boolean;
  private validAgainstStrategies: boolean;

  view(vnode) {
    const author = app.user.activeAccount;

    const { proposal, space, id, selectedChoice, totalScore } = vnode.attrs;

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
            disabled: this.saving,
            rounded: true,
            onclick: async (e) => {
              e.preventDefault();
              $(e.target).trigger('modalexit');
            },
            label: 'Cancel',
          }),
          m(Button, {
            intent: 'primary',
            disabled: this.saving,
            rounded: true,
            onclick: async (e) => {
              e.preventDefault();

              this.saving = true;

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
                mixpanelBrowserTrack({
                  event: MixpanelSnapshotEvents.SNAPSHOT_VOTE_OCCURRED,
                  isCustomDomain: app.isCustomDomain(),
                  space: app.snapshot.space.id,
                });
              } catch (err) {
                console.log(err);
                const errorMessage = err.message;
                notifyError(errorMessage);
              }

              this.saving = false;
            },
            label: 'Vote',
          }),
        ]),
      ]),
    ]);
  }
}
