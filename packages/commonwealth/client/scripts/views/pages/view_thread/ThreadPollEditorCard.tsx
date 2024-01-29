import 'pages/view_thread/poll_cards.scss';
import React, { useState } from 'react';
import type Thread from '../../../models/Thread';
import { CWContentPageCard } from '../../components/component_kit/CWContentPageCard';
import { CWButton } from '../../components/component_kit/cw_button';
import { CWModal } from '../../components/component_kit/new_designs/CWModal';
import { PollEditorModal } from '../../modals/poll_editor_modal';

type ThreadPollEditorCardProps = {
  thread: Thread;
  threadAlreadyHasPolling: boolean;
  onPollCreate: () => void;
};

export const ThreadPollEditorCard = ({
  thread,
  threadAlreadyHasPolling,
  onPollCreate,
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
              className="create-poll-button"
              buttonType="mini-black"
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
            onPollCreate={onPollCreate}
          />
        }
        onClose={() => setIsModalOpen(false)}
        open={isModalOpen}
      />
    </>
  );
};
