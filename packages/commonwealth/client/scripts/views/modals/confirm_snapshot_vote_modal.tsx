import React from 'react';

import type { ResultNode } from 'mithrilInterop';
import { ClassComponent, redraw } from 'mithrilInterop';
import $ from 'jquery';
import { notifyError } from 'controllers/app/notifications';
import type { SnapshotProposal, SnapshotSpace } from 'helpers/snapshot_utils';
import { castVote } from 'helpers/snapshot_utils';
import { formatNumberShort } from 'adapters/currency';
import { MixpanelSnapshotEvents } from 'analytics/types';

import 'modals/confirm_snapshot_vote_modal.scss';

import app from 'state';
import { ModalExitButton } from 'views/components/component_kit/cw_modal';
import { mixpanelBrowserTrack } from '../../helpers/mixpanel_browser_util';
import { CWButton } from '../components/component_kit/cw_button';
import { CWText } from '../components/component_kit/cw_text';

type ConfirmSnapshotVoteModalAttrs = {
  id: string;
  proposal: SnapshotProposal;
  scores: any;
  selectedChoice: string;
  snapshot: any;
  space: SnapshotSpace;
  totalScore: number;
  successCallback: () => any;
};

export class ConfirmSnapshotVoteModal extends ClassComponent<ConfirmSnapshotVoteModalAttrs> {
  private saving: boolean;

  view(vnode: ResultNode<ConfirmSnapshotVoteModalAttrs>) {
    const author = app.user.activeAccount;

    const { proposal, space, id, selectedChoice, totalScore, successCallback } =
      vnode.attrs;

    return (
      <div className="ConfirmSnapshotVoteModal">
        <div className="compact-modal-title">
          <h3>Confirm vote</h3>
          <ModalExitButton />
        </div>
        <div className="compact-modal-body">
          <CWText type="h4" fontWeight="semiBold">
            Are you sure you want to vote {proposal.choices[selectedChoice]}?
          </CWText>
          <CWText type="h5">This action cannot be undone.</CWText>
          <div className="vote-info">
            <div className="vote-info-row">
              <CWText>Option</CWText>
              <CWText>{proposal.choices[selectedChoice]}</CWText>
            </div>
            <div className="vote-info-row">
              <CWText>Your voting power</CWText>
              <CWText>
                {`${formatNumberShort(totalScore)} ${space.symbol
                  .slice(0, 6)
                  .trim()}...`}
              </CWText>
            </div>
          </div>
          <div className="button-group">
            <CWButton
              label="Cancel"
              buttonType="secondary-blue"
              disabled={this.saving}
              onClick={async (e) => {
                e.preventDefault();
                $(e.target).trigger('modalexit');
              }}
            />
            <CWButton
              label="Vote"
              disabled={this.saving}
              onClick={async (e) => {
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
                    successCallback();
                    redraw();
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
              }}
            />
          </div>
        </div>
      </div>
    );
  }
}
