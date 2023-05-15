import React, { useState } from 'react';

import app from 'state';
import { CWButton } from '../../components/component_kit/cw_button';
import { CWContentPageCard } from '../../components/component_kit/cw_content_page';
import { NewSnapshotProposalPageComponent } from '../new_snapshot_proposal';
import { Modal } from '../../components/component_kit/cw_modal';

import 'pages/view_thread/snapshot_creation_card.scss';

import type Thread from '../../../models/Thread';
import { CWText } from '../../components/component_kit/cw_text';

type SnapshotCreationCardProps = {
  thread: Thread;
  allowSnapshotCreation: boolean;
  onChangeHandler: () => void;
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
                buttonType="mini-black"
                label="Create Snapshot"
                onClick={() => setIsModalOpen(true)}
              />
            )}
          </div>
        }
      />
      <Modal
        content={
          <NewSnapshotProposalPageComponent
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
