import React, { useEffect, useMemo, useState } from 'react';

import type Thread from '../../models/Thread';
import app from '../../state';
import { CWDropdown } from '../components/component_kit/cw_dropdown';
import {
  CWModalBody,
  CWModalHeader,
} from '../components/component_kit/new_designs/CWModal';
import { NewSnapshotProposalForm } from '../pages/new_snapshot_proposal';

import '../../../styles/modals/new_snapshot_proposal_modal.scss';

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
    null,
  );
  const handleSelect = (item) => {
    setSelectedSnapshotId(item.value);
    const init = async () => {
      await app.snapshot.init(item.value);
    };
    init();
  };

  const snapshotOptions = useMemo(
    () =>
      app.chain?.meta.snapshot.map((snapshot) => ({
        value: snapshot,
        label: snapshot,
      })) || [],
    [],
  );
  console.log('snapshotOptions', snapshotOptions);
  useEffect(() => {
    if (snapshotOptions.length > 0) {
      setSelectedSnapshotId(snapshotOptions[0].value);
    }
  }, [snapshotOptions]);

  return (
    <div className="NewSnapshotProposalModal">
      <CWModalHeader label="Create New Snapshot" onModalClose={onModalClose} />
      <CWModalBody>
        {snapshotOptions.length > 0 ? (
          <>
            <CWDropdown
              label="Select Snapshot Space"
              options={snapshotOptions}
              // onSelect={(item) => setSelectedSnapshotId(item.value)}
              onSelect={handleSelect}
            />
            {selectedSnapshotId && (
              <NewSnapshotProposalForm
                snapshotId={selectedSnapshotId}
                thread={thread}
                onSave={onSave}
                onModalClose={onModalClose}
              />
            )}
          </>
        ) : (
          <NewSnapshotProposalForm
            snapshotId={selectedSnapshotId}
            thread={thread}
            onSave={onSave}
            onModalClose={onModalClose}
          />
        )}
      </CWModalBody>
    </div>
  );
};
