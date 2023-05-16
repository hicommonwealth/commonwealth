import React from 'react';
import { NewSnapshotProposalForm } from '../pages/new_snapshot_proposal';
import { CWButton } from '../components/component_kit/cw_button';
import { CWIconButton } from '../components/component_kit/cw_icon_button';

import 'modals/new_snapshot_proposal_modal.scss';

import type Thread from '../../models/Thread';

type NewSnapshotProposalModalProps = {
  snapshotId: Thread;
  onSave: () => void;
  onModalClose: () => void;
};

export const NewSnapshotProposalModal = ({
  snapshotId,
  onSave,
  onModalClose,
}: NewSnapshotProposalModalProps) => {
  return (
    <div className="NewSnapshotProposalModal">
      <div className="compact-modal-title">
        <h3>Create New Snapshot</h3>
        <CWIconButton iconName="close" onClick={onModalClose} />
      </div>
      <div className="compact-modal-body">
        <NewSnapshotProposalForm
          snapshotId={snapshotId}
          onSave={onSave}
          onModalClose={onModalClose}
        />
      </div>
    </div>
  );
};
