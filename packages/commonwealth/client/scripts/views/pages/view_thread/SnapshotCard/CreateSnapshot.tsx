import type Thread from 'client/scripts/models/Thread';
import React from 'react';
import { CWModal } from '../../../components/component_kit/new_designs/CWModal';
import { NewSnapshotProposalModal } from '../../../modals/new_snapshot_proposal_modal';

export type CreateSnapshotProps = {
  thread: Thread;
  isOpen: boolean;
  onClose: () => void;
  onSnapshotSaved: (snapshotInfo: {
    id: string;
    snapshot_title: string;
  }) => void;
};

export const CreateSnapshot = ({
  thread,
  isOpen,
  onClose,
  onSnapshotSaved,
}: CreateSnapshotProps) => {
  return (
    <CWModal
      size="large"
      content={
        <NewSnapshotProposalModal
          thread={thread}
          onSave={onSnapshotSaved}
          onModalClose={onClose}
        />
      }
      onClose={onClose}
      open={isOpen}
    />
  );
};
