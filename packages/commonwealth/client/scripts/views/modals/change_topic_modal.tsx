import React, { useState } from 'react';

import 'modals/change_topic_modal.scss';
import type { Thread, Topic } from 'models';

import app from 'state';
import { CWButton } from '../components/component_kit/cw_button';
import { TopicSelector } from '../components/topic_selector';
import { CWIconButton } from '../components/component_kit/cw_icon_button';

type ChangeTopicModalProps = {
  onChangeHandler: (topic: Topic) => void;
  onModalClose: () => void;
  thread: Thread;
};

export const ChangeTopicModal = ({
  onChangeHandler,
  onModalClose,
  thread,
}: ChangeTopicModalProps) => {
  const [activeTopic, setActiveTopic] = useState<Topic>(thread.topic);
  const topics = app.topics.getByCommunity(app.activeChainId());

  const handleSaveChanges = async () => {
    try {
      const topic: Topic = await app.topics.update(
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
    <div className="ChangeTopicModal">
      <div className="compact-modal-title">
        <h3>Change topic</h3>
        <CWIconButton iconName="close" onClick={onModalClose} />
      </div>
      <div className="compact-modal-body">
        <TopicSelector
          defaultTopic={activeTopic}
          topics={topics}
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
