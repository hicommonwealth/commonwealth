import React from 'react';

import { formatBigNumberShort } from 'adapters/currency';
import { MixpanelSnapshotEvents } from 'analytics/types';
import type { SnapshotProposal, SnapshotSpace } from 'helpers/snapshot_utils';
import { useBrowserAnalyticsTrack } from 'hooks/useBrowserAnalyticsTrack';
import useUserStore from 'state/ui/user';
import { notifyError } from '../../controllers/app/notifications';
import { castVote } from '../../helpers/snapshot_utils';
import useAppStatus from '../../hooks/useAppStatus';
import { CWText } from '../components/component_kit/cw_text';
import { CWButton } from '../components/component_kit/new_designs/CWButton';
import {
  CWModalBody,
  CWModalFooter,
  CWModalHeader,
} from '../components/component_kit/new_designs/CWModal';
import './confirm_snapshot_vote_modal.scss';

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
  props: ConfirmSnapshotVoteModalProps,
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

  const user = useUserStore();

  const author = user.activeAccount;

  const [isSaving, setIsSaving] = React.useState<boolean>(false);

  const { isAddedToHomeScreen } = useAppStatus();

  const { trackAnalytics } = useBrowserAnalyticsTrack({ onAction: true });

  const handleVote = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    const votePayload = {
      space: space.id,
      proposal: id,
      type: 'single-choice',
      choice: parseInt(selectedChoice) + 1,
      metadata: JSON.stringify({}),
    };
    try {
      castVote(author?.address || '', votePayload, space.id)
        .then(() => {
          onModalClose();
          successCallback();
        })
        .catch(console.error);
      trackAnalytics({
        event: MixpanelSnapshotEvents.SNAPSHOT_VOTE_OCCURRED,
        isPWA: isAddedToHomeScreen,
      });
    } catch (err) {
      console.log(err);
      const errorMessage = err.message;
      notifyError(errorMessage);
    }
    setIsSaving(false);
  };

  return (
    <div className="ConfirmSnapshotVoteModal">
      <CWModalHeader label="Confirm vote" onModalClose={onModalClose} />
      <CWModalBody>
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
              {`${formatBigNumberShort(
                totalScore,
                8,
              )} ${space.symbol.slice(0, 6).trim()}...`}
            </CWText>
          </div>
        </div>
      </CWModalBody>
      <CWModalFooter>
        <CWButton
          label="Cancel"
          buttonType="secondary"
          buttonHeight="sm"
          disabled={isSaving}
          onClick={async (e) => {
            e.preventDefault();
            onModalClose();
          }}
        />
        <CWButton
          label="Vote"
          buttonType="primary"
          buttonHeight="sm"
          disabled={isSaving}
          onClick={handleVote}
        />
      </CWModalFooter>
    </div>
  );
};
