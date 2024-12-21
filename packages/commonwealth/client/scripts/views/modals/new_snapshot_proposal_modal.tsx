import React, { useEffect, useMemo, useState } from 'react';

import NewSnapshotProposalForm from 'views/pages/Snapshots/NewSnapshotProposal/NewSnapshotProposalForm';

import type Thread from '../../models/Thread';
import app from '../../state';
import { CWDropdown } from '../components/component_kit/cw_dropdown';
import { CWButton } from '../components/component_kit/new_designs/CWButton';
import {
  CWModalBody,
  CWModalFooter,
  CWModalHeader,
} from '../components/component_kit/new_designs/CWModal';

import './new_snapshot_proposal_modal.scss';

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
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [isValid, setIsValid] = useState<boolean>(false);

  const handleSelect = async (item) => {
    setSelectedSnapshotId(item.value);
  };

  const snapshotOptions = useMemo(
    () =>
      app.chain?.meta.snapshot_spaces.map((snapshot) => ({
        value: snapshot,
        label: snapshot,
      })) || [],
    [],
  );

  useEffect(() => {
    if (snapshotOptions.length > 0) {
      setSelectedSnapshotId(snapshotOptions[0].value);
    }
  }, [snapshotOptions]);

  return (
    <div className="NewSnapshotProposalModal">
      <CWModalHeader label="Create new Snapshot" onModalClose={onModalClose} />
      <CWModalBody>
        {snapshotOptions.length > 0 ? (
          <>
            <CWDropdown
              label="Select Snapshot Space"
              options={snapshotOptions}
              onSelect={handleSelect}
            />
            {selectedSnapshotId && (
              <NewSnapshotProposalForm
                snapshotId={selectedSnapshotId || ''}
                thread={thread}
                onSave={onSave}
                onModalClose={onModalClose}
                onPublish={(publishing) => setIsPublishing(publishing)}
                onValidityChange={(valid) => setIsValid(valid)}
                hideButtons
              />
            )}
          </>
        ) : (
          <NewSnapshotProposalForm
            snapshotId={selectedSnapshotId || ''}
            thread={thread}
            onSave={onSave}
            onModalClose={onModalClose}
            onPublish={(publishing) => setIsPublishing(publishing)}
            onValidityChange={(valid) => setIsValid(valid)}
            hideButtons
          />
        )}
      </CWModalBody>
      <CWModalFooter>
        <CWButton
          buttonHeight="sm"
          buttonType="secondary"
          label="Cancel"
          onClick={onModalClose}
        />
        <CWButton
          buttonHeight="sm"
          label="Publish"
          disabled={!isValid || isPublishing}
          onClick={() => {
            const formElement = document.querySelector(
              '.NewSnapshotProposalForm form',
            );
            if (formElement) {
              formElement.dispatchEvent(new Event('submit'));
            }
          }}
        />
      </CWModalFooter>
    </div>
  );
};
