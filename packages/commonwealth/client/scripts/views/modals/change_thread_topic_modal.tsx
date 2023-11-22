import React, { useState } from 'react';

import Permissions from 'utils/Permissions';
import type Thread from '../../models/Thread';
import type Topic from '../../models/Topic';
import app from '../../state';
import { useEditThreadMutation } from '../../state/api/threads';
import { useFetchTopicsQuery } from '../../state/api/topics';
import {
  CWModalBody,
  CWModalFooter,
  CWModalHeader,
} from '../components/component_kit/new_designs/CWModal';
import { CWButton } from '../components/component_kit/new_designs/cw_button';
import { TopicSelector } from '../components/topic_selector';

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
    { enabledTopics: [], disabledTopics: [] },
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
      <CWModalHeader label="Change topic" onModalClose={onModalClose} />
      <CWModalBody>
        <TopicSelector
          enabledTopics={topicsForSelector.enabledTopics}
          disabledTopics={topicsForSelector.disabledTopics}
          value={activeTopic}
          onChange={setActiveTopic}
        />
      </CWModalBody>
      <CWModalFooter>
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
      </CWModalFooter>
    </div>
  );
};
