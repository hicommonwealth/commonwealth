import React, { useState } from 'react';

import { buildUpdateThreadInput } from 'client/scripts/state/api/threads/editThread';
import useUserStore from 'state/ui/user';
import type Thread from '../../models/Thread';
import type { Topic } from '../../models/Topic';
import app from '../../state';
import { useEditThreadMutation } from '../../state/api/threads';
import { useFetchTopicsQuery } from '../../state/api/topics';
import { CWButton } from '../components/component_kit/new_designs/CWButton';
import {
  CWModalBody,
  CWModalFooter,
  CWModalHeader,
} from '../components/component_kit/new_designs/CWModal';
import { TopicSelector } from '../components/topic_selector';

type ChangeThreadTopicModalProps = {
  onModalClose: () => void;
  thread: Thread;
};

export const ChangeThreadTopicModal = ({
  onModalClose,
  thread,
}: ChangeThreadTopicModalProps) => {
  const [activeTopic, setActiveTopic] = useState<Topic>(thread.topic!);
  const { data: topics } = useFetchTopicsQuery({
    communityId: app.activeChainId() || '',
    apiEnabled: !!app.activeChainId(),
  });
  const user = useUserStore();

  const topicsForSelector = topics?.reduce(
    (acc, t) => {
      // @ts-expect-error <StrictNullChecks/>
      acc.enabledTopics.push(t);
      return acc;
    },
    { enabledTopics: [], disabledTopics: [] },
  );

  const { mutateAsync: editThread } = useEditThreadMutation({
    communityId: app.activeChainId() || '',
    threadId: thread.id,
    threadMsgId: thread.canvasMsgId!,
    currentStage: thread.stage,
    currentTopicId: thread.topic!.id!,
  });

  const handleSaveChanges = async () => {
    try {
      const input = await buildUpdateThreadInput({
        communityId: app.activeChainId() || '',
        address: user.activeAccount?.address || '',
        threadMsgId: thread.canvasMsgId!,
        threadId: thread.id,
        topicId: activeTopic.id,
      });
      await editThread(input);
      onModalClose && onModalClose();
    } catch (err) {
      const error =
        err?.response?.data?.error || 'Failed to update thread topic';
      console.log(error);
      throw new Error(error);
    }
  };

  return (
    <div className="ChangeThreadTopicModal">
      <CWModalHeader label="Change topic" onModalClose={onModalClose} />
      <CWModalBody>
        <TopicSelector
          // @ts-expect-error <StrictNullChecks/>
          enabledTopics={topicsForSelector.enabledTopics}
          // @ts-expect-error <StrictNullChecks/>
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
