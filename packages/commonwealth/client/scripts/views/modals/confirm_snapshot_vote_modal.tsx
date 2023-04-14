import { formatNumberShort } from 'adapters/currency';

import { notifyError } from 'controllers/app/notifications';
import type { SnapshotProposal, SnapshotSpace } from 'helpers/snapshot_utils';
import { castVote } from 'helpers/snapshot_utils';

import { redraw } from 'mithrilInterop';
// import { MixpanelSnapshotEvents } from 'analytics/types';
import 'modals/confirm_snapshot_vote_modal.scss';
import React from 'react';

import app from 'state';
import { CWButton } from '../components/component_kit/cw_button';
import { CWIconButton } from '../components/component_kit/cw_icon_button';
import { CWText } from '../components/component_kit/cw_text';

type ConfirmSnapshotVoteModalProps = {
  id: string;
  onModalClose: () => void;
  proposal: SnapshotProposal;
  scores: any;
  selectedChoice: string;
  snapshot: any;
  space: SnapshotSpace;
  totalScore: number;
  successCallback: () => any;
};

export const ConfirmSnapshotVoteModal = (
  props: ConfirmSnapshotVoteModalProps
) => {
  const {
    id,
    onModalClose,
    proposal,
    selectedChoice,
    space,
    successCallback,
    totalScore,
  } = props;

  const author = app.user.activeAccount;

  const [isSaving, setIsSaving] = React.useState<boolean>(false);

  return (
    <div className="ConfirmSnapshotVoteModal">
      <div className="compact-modal-title">
        <h3>Confirm vote</h3>
        <CWIconButton iconName="close" onClick={() => onModalClose()} />
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
            disabled={isSaving}
            onClick={async (e) => {
              e.preventDefault();
              onModalClose();
            }}
          />
          <CWButton
            label="Vote"
            disabled={isSaving}
            onClick={async (e) => {
              e.preventDefault();

              setIsSaving(true);

              const votePayload = {
                space: space.id,
                proposal: id,
                type: 'single-choice',
                choice: selectedChoice + 1,
                metadata: JSON.stringify({}),
              };

              try {
                castVote(author.address, votePayload).then(() => {
                  onModalClose();
                  successCallback();
                  redraw();
                });
                // mixpanelBrowserTrack({
                //   event: MixpanelSnapshotEvents.SNAPSHOT_VOTE_OCCURRED,
                //   isCustomDomain: app.isCustomDomain(),
                //   space: app.snapshot.space.id,
                // });
              } catch (err) {
                console.log(err);
                const errorMessage = err.message;
                notifyError(errorMessage);
              }

              setIsSaving(false);
            }}
          />
        </div>
      </div>
    </div>
  );
};
