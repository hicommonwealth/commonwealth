import { DEFAULT_COMPLETION_MODEL } from '@hicommonwealth/shared';
import { notifyError } from 'client/scripts/controllers/app/notifications';
import type Thread from 'client/scripts/models/Thread';
import { AICompletionType, useAiCompletion } from 'client/scripts/state/api/ai';
import React, { useEffect, useState } from 'react';
import { useAIFeatureEnabled } from 'state/ui/user';
import { CWModal } from '../../../components/component_kit/new_designs/CWModal';
import { PollEditorModal } from '../../../modals/poll_editor_modal';

export type CreatePollProps = {
  thread: Thread;
  isOpen: boolean;
  onClose: () => void;
};

export const CreatePoll = ({ thread, isOpen, onClose }: CreatePollProps) => {
  const [pollData, setPollData] = useState<string>();
  const [isAIresponseCompleted, setIsAIresponseCompleted] = useState(true);
  const { generateCompletion } = useAiCompletion();
  const { isAIEnabled } = useAIFeatureEnabled();

  useEffect(() => {
    if (isOpen) {
      setPollData(undefined);
      setIsAIresponseCompleted(true);
    }
  }, [isOpen]);

  const handleGeneratePoll = () => {
    const communityId = thread?.communityId;
    if (!communityId) {
      notifyError('Community ID is required for poll generation');
      return;
    }
    setIsAIresponseCompleted(false);
    setPollData('');
    let text = '';
    generateCompletion(
      {
        communityId,
        completionType: AICompletionType.Poll,
        threadId: thread?.id,
        model: DEFAULT_COMPLETION_MODEL,
        stream: true,
      },
      {
        onError: () => {
          notifyError('Failed to generate Poll');
          setIsAIresponseCompleted(true);
        },
        onChunk: (chunk) => {
          text += chunk;
          text = text.trim();
          setPollData(text);
        },
        onComplete: () => setIsAIresponseCompleted(true),
      },
    ).catch(() => setIsAIresponseCompleted(true));
  };

  const handleClose = () => {
    setIsAIresponseCompleted(true);
    setPollData(undefined);
    onClose();
  };

  return (
    <CWModal
      size="medium"
      content={
        <PollEditorModal
          thread={thread}
          onModalClose={handleClose}
          pollData={pollData}
          isAIresponseCompleted={isAIresponseCompleted}
          onGeneratePoll={isAIEnabled ? handleGeneratePoll : undefined}
        />
      }
      onClose={handleClose}
      open={isOpen}
    />
  );
};
