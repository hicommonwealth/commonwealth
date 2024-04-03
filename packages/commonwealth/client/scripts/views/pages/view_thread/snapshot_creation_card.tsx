import React, { useState } from 'react';

import { CWContentPageCard } from '../../components/component_kit/CWContentPageCard';
import { CWButton } from '../../components/component_kit/new_designs/cw_button';
import { CWModal } from '../../components/component_kit/new_designs/CWModal';
import { NewSnapshotProposalModal } from '../../modals/new_snapshot_proposal_modal';

import 'pages/view_thread/snapshot_creation_card.scss';

import type Thread from '../../../models/Thread';
import { CWText } from '../../components/component_kit/cw_text';

type SnapshotCreationCardProps = {
  thread: Thread;
  allowSnapshotCreation: boolean;
  onChangeHandler: (snapshotInfo: {
    id: string;
    snapshot_title: string;
  }) => void;
};

export const SnapshotCreationCard = ({
  thread,
  allowSnapshotCreation,
  onChangeHandler,
}: SnapshotCreationCardProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <CWContentPageCard
        header="Create Snapshot"
        content={
          <div className="SnapshotCreationCard">
            <CWText type="b2" className="no-threads-text">
              Create a snapshot of this discussion to be voted with one click
            </CWText>
            {allowSnapshotCreation && (
              <CWButton
                buttonHeight="sm"
                label="Create Snapshot"
                onClick={() => setIsModalOpen(true)}
              />
            )}
          </div>
        }
      />
      <CWModal
        size="large"
        content={
          <NewSnapshotProposalModal
            thread={thread}
            onSave={onChangeHandler}
            onModalClose={() => setIsModalOpen(false)}
          />
        }
        onClose={() => setIsModalOpen(false)}
        open={isModalOpen}
      />
    </>
  );
};
