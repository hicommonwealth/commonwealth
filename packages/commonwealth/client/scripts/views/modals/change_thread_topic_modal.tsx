import React, { useState } from 'react';
import { X } from '@phosphor-icons/react';

import type Thread from '../../models/Thread';
import type Topic from '../../models/Topic';
import app from 'state';
import { CWButton } from '../components/component_kit/new_designs/cw_button';
import { TopicSelector } from '../components/topic_selector';
import { useFetchTopicsQuery } from 'state/api/topics';
import { CWText } from '../components/component_kit/cw_text';

import 'modals/change_thread_topic_modal.scss';

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

  const handleSaveChanges = async () => {
    try {
      const topic: Topic = await app.threads.updateTopic(
        thread.id,
        activeTopic.name,
        activeTopic.id
      );
      onChangeHandler(topic);
      onModalClose();
    } catch (err) {
      console.log('Failed to update topic');
      throw new Error(
        err.responseJSON && err.responseJSON.error
          ? err.responseJSON.error
          : 'Failed to update topic'
      );
    }
  };

  return (
    <div className="ChangeThreadTopicModal">
      <div className="compact-modal-title">
        <CWText className="title-text" type="h4">
          Change topic
        </CWText>
        <X className="close-icon" onClick={() => onModalClose()} size={24} />
      </div>
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
