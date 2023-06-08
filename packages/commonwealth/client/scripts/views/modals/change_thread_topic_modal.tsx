import React, { useState } from 'react';

import 'modals/change_thread_topic_modal.scss';
import type Thread from '../../models/Thread';
import type Topic from '../../models/Topic';

import app from 'state';
import { CWButton } from '../components/component_kit/cw_button';
import { TopicSelector } from '../components/topic_selector';
import { CWIconButton } from '../components/component_kit/cw_icon_button';
import { useFetchTopicsQuery } from 'state/api/topics';

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
