import React, { useState } from 'react';
import 'modals/change_thread_topic_modal.scss';
import type Thread from '../../models/Thread';
import type Topic from '../../models/Topic';
import app from 'state';
import { useEditThreadMutation } from 'state/api/threads';
import { useFetchTopicsQuery } from 'state/api/topics';
import { CWButton } from '../components/component_kit/cw_button';
import { CWIconButton } from '../components/component_kit/cw_icon_button';
import { TopicSelector } from '../components/topic_selector';
import Permissions from 'utils/Permissions';

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

  const isAdmin = Permissions.isCommunityAdmin();
  const topicsForSelector = topics?.reduce(
    (acc, t) => {
      if (
        isAdmin ||
        t.tokenThreshold.isZero() ||
        !app.chain.isGatedTopic(t.id)
      ) {
        acc.enabledTopics.push(t);
      } else {
        acc.disabledTopics.push(t);
      }
      return acc;
    },
    { enabledTopics: [], disabledTopics: [] }
  );

  const { mutateAsync: editThread } = useEditThreadMutation({
    chainId: app.activeChainId(),
    threadId: thread.id,
    currentStage: thread.stage,
    currentTopicId: thread.topic.id,
  });

  const handleSaveChanges = async () => {
    try {
      await editThread({
        chainId: app.activeChainId(),
        address: app.user.activeAccount.address,
        threadId: thread.id,
        topicId: activeTopic.id,
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
      <div className="compact-modal-title">
        <h3>Change topic</h3>
        <CWIconButton iconName="close" onClick={onModalClose} />
      </div>
      <div className="compact-modal-body">
        <TopicSelector
          enabledTopics={topicsForSelector.enabledTopics}
          disabledTopics={topicsForSelector.disabledTopics}
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
