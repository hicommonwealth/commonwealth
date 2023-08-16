import React, { useState } from 'react';

import type Thread from '../../models/Thread';
import type Topic from '../../models/Topic';
import app from 'state';
import { useEditThreadTopicMutation } from 'state/api/threads';
import { useFetchTopicsQuery } from 'state/api/topics';
import { CWButton } from '../components/component_kit/new_designs/cw_button';
import { TopicSelector } from '../components/topic_selector';
import { CWModalHeader } from './CWModalHeader';

import 'modals/change_thread_topic_modal.scss';

type ChangeThreadTopicModalProps = {
  onModalClose: () => void;
  thread: Thread;
};

export const ChangeThreadTopicModal = ({
  onModalClose,
  thread,
}: ChangeThreadTopicModalProps) => {
  const [activeTopic, setActiveTopic] = useState<Topic>(thread.topic);
  const { data: topics } = useFetchTopicsQuery({
    chainId: app.activeChainId(),
  });

  const { mutateAsync: editThreadTopic } = useEditThreadTopicMutation({
    chainId: app.activeChainId(),
    threadId: thread.id,
  });

  const handleSaveChanges = async () => {
    try {
      await editThreadTopic({
        chainId: app.activeChainId(),
        address: app.user.activeAccount.address,
        threadId: thread.id,
        topicName: activeTopic.name,
        newTopicId: activeTopic.id,
        oldTopicId: thread?.topic?.id,
      });

      onModalClose && onModalClose();
    } catch (err) {
      const error = err?.responseJSON?.error || 'Failed to update thread topic';
      console.log(error);
      throw new Error(error);
    }
  };

  return (
    <div className="ChangeThreadTopicModal">
      <CWModalHeader label="Change topic" onModalClose={onModalClose} />
      <div className="compact-modal-body">
        <TopicSelector
          topics={topics}
          value={activeTopic}
          onChange={setActiveTopic}
        />
        <div className="buttons-row">
          <CWButton
            buttonType="secondary"
            buttonHeight="sm"
            label="Cancel"
            onClick={onModalClose}
          />
          <CWButton
            buttonType="primary"
            buttonHeight="sm"
            label="Save changes"
            onClick={handleSaveChanges}
          />
        </div>
      </div>
    </div>
  );
};
