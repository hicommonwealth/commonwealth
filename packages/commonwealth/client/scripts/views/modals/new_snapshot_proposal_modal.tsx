import React, { useState, useEffect, useMemo } from 'react';

import { NewSnapshotProposalForm } from '../pages/new_snapshot_proposal';
import app from 'state';
import type Thread from '../../models/Thread';
import { CWDropdown } from '../components/component_kit/cw_dropdown';
import { CWModalHeader } from './CWModalHeader';

import 'modals/new_snapshot_proposal_modal.scss';

type NewSnapshotProposalModalProps = {
  thread: Thread;
  onSave: (snapshotInfo: { id: string; snapshot_title: string }) => void;
  onModalClose: () => void;
};

export const NewSnapshotProposalModal = ({
  thread,
  onSave,
  onModalClose,
}: NewSnapshotProposalModalProps) => {
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string | null>(
    null
  );

  const snapshotOptions = useMemo(
    () =>
      app.chain?.meta.snapshot.map((snapshot) => ({
        value: snapshot,
        label: snapshot,
      })) || [],
    []
  );

  useEffect(() => {
    if (snapshotOptions.length > 0) {
      setSelectedSnapshotId(snapshotOptions[0].value);
    }
  }, [snapshotOptions]);

  return (
    <div className="NewSnapshotProposalModal">
      <CWModalHeader label="Create New Snapshot" onModalClose={onModalClose} />
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
                thread={thread}
                onSave={onSave}
              />
            )}
          </>
        ) : (
          <NewSnapshotProposalForm
            snapshotId={selectedSnapshotId}
            thread={thread}
            onSave={onSave}
          />
        )}
      </div>
    </div>
  );
};
