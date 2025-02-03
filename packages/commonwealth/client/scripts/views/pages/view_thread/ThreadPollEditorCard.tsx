import React, { useState } from 'react';
import type Thread from '../../../models/Thread';
import { CWContentPageCard } from '../../components/component_kit/CWContentPageCard';
import { CWButton } from '../../components/component_kit/new_designs/CWButton';
import { CWModal } from '../../components/component_kit/new_designs/CWModal';
import { PollEditorModal } from '../../modals/poll_editor_modal';
import './poll_cards.scss';

type ThreadPollEditorCardProps = {
  thread: Thread;
  threadAlreadyHasPolling: boolean;
};

export const ThreadPollEditorCard = ({
  thread,
  threadAlreadyHasPolling,
}: ThreadPollEditorCardProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <CWContentPageCard
        header={`Add ${
          threadAlreadyHasPolling ? 'an' : 'another'
        } offchain poll to this
        thread?`}
        content={
          <div className="PollEditorCard">
            <CWButton
              buttonHeight="sm"
              className="create-poll-button"
              label="Create poll"
              onClick={(e) => {
                e.preventDefault();
                setIsModalOpen(true);
              }}
            />
          </div>
        }
      />
      <CWModal
        size="medium"
        content={
          <PollEditorModal
            thread={thread}
            onModalClose={() => setIsModalOpen(false)}
          />
        }
        onClose={() => setIsModalOpen(false)}
        open={isModalOpen}
      />
    </>
  );
};
