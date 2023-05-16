import React, { useState, useEffect } from 'react';
import { NewSnapshotProposalForm } from '../pages/new_snapshot_proposal';
import { CWButton } from '../components/component_kit/cw_button';
import { CWIconButton } from '../components/component_kit/cw_icon_button';

import app from 'state';

import 'modals/new_snapshot_proposal_modal.scss';

import type Thread from '../../models/Thread';
import { CWDropdown } from '../components/component_kit/cw_dropdown';

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
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string | null>(
    null
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const snapshotOptions =
    app.chain?.meta.snapshot.map((snapshot) => ({
      value: snapshot,
      label: snapshot,
    })) || [];

  useEffect(() => {
    if (snapshotOptions.length > 0) {
      setSelectedSnapshotId(snapshotOptions[0].value);
    }
  }, [snapshotOptions]);

  return (
    <div className="NewSnapshotProposalModal">
      <div className="compact-modal-title">
        <h3>Create New Snapshot</h3>
        <CWIconButton iconName="close" onClick={onModalClose} />
      </div>
      <div className="compact-modal-body">
        {snapshotOptions.length > 0 ? (
          <>
            <CWDropdown
              label="Select Snapshot Space"
              options={snapshotOptions}
              onSelect={(item) => setSelectedSnapshotId(item.value)}
            />
            {selectedSnapshotId && (
              <NewSnapshotProposalForm
                snapshotId={selectedSnapshotId}
                onSave={onSave}
                onModalClose={onModalClose}
              />
            )}
          </>
        ) : (
          <NewSnapshotProposalForm
            snapshotId={selectedSnapshotId}
            onSave={onSave}
            onModalClose={onModalClose}
          />
        )}
      </div>
    </div>
  );
};
