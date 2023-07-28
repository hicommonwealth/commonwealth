import React, { useState } from 'react';

import 'modals/change_thread_topic_modal.scss';
import type Thread from '../../models/Thread';
import type Topic from '../../models/Topic';

import app from 'state';
import { useEditThreadTopicMutation } from 'state/api/threads';
import { useFetchTopicsQuery } from 'state/api/topics';
import { CWButton } from '../components/component_kit/cw_button';
import { CWIconButton } from '../components/component_kit/cw_icon_button';
import { TopicSelector } from '../components/topic_selector';

type ChangeThreadTopicModalProps = {
  onChangeHandler: (topic: Topic) => void;
  onModalClose: () => void;
  thread: Thread;
};

export const ChangeThreadTopicModal = ({
  onChangeHandler,
  onModalClose,
  thread,
}: ChangeThreadTopicModalProps) => {
  const [activeTopic, setActiveTopic] = useState<Topic>(thread.topic);
  const { data: topics } = useFetchTopicsQuery({
    chainId: app.activeChainId(),
  });

  const { mutateAsync: editThreadTopic } = useEditThreadTopicMutation({
    chainId: app.activeChainId(),
    threadId: thread.id
  })

  const handleSaveChanges = async () => {
    try {
      const { updatedTopic }: { updatedTopic: Topic } = await editThreadTopic({
        chainId: app.activeChainId(),
        address: app.user.activeAccount.address,
        threadId: thread.id,
        topicName: activeTopic.name,
        newTopicId: activeTopic.id,
        oldTopicId: thread?.topic?.id
      })

      onChangeHandler(updatedTopic);
      onModalClose();
    } catch (err) {
      const error = err?.responseJSON?.error || 'Failed to update thread topic'
      console.log(error);
      throw new Error(error);
    }
  };

  return (
    <div className="ChangeThreadTopicModal">
      <div className="compact-modal-title">
        <h3>Change topic</h3>
        <CWIconButton iconName="close" onClick={onModalClose} />
      </div>
      <div className="compact-modal-body">
        <TopicSelector
          topics={topics}
          value={activeTopic}
          onChange={setActiveTopic}
        />
        <div className="buttons-row">
          <CWButton
            buttonType="secondary-blue"
            label="Cancel"
            onClick={onModalClose}
          />
          <CWButton label="Save changes" onClick={handleSaveChanges} />
        </div>
      </div>
    </div>
  );
};
