import { DEFAULT_COMPLETION_MODEL } from '@hicommonwealth/shared';
import { notifyError } from 'client/scripts/controllers/app/notifications';
import type Thread from 'client/scripts/models/Thread';
import { AICompletionType, useAiCompletion } from 'client/scripts/state/api/ai';
import React, { useEffect, useState } from 'react';
import { useAIFeatureEnabled } from 'state/ui/user';
import { CWModal } from '../../../components/component_kit/new_designs/CWModal';
import { PredictionMarketEditorModal } from '../../../modals/PredictionMarket/PredictionMarketEditorModal';

export type CreatePredictionMarketProps = {
  thread: Thread;
  isOpen: boolean;
  onClose: () => void;
};

export const CreatePredictionMarket = ({
  thread,
  isOpen,
  onClose,
}: CreatePredictionMarketProps) => {
  const [promptData, setPromptData] = useState('');
  const [isAIresponseCompleted, setIsAIresponseCompleted] = useState(true);
  const { generateCompletion } = useAiCompletion();
  const { isAIEnabled } = useAIFeatureEnabled();

  useEffect(() => {
    if (isOpen) {
      setPromptData('');
      setIsAIresponseCompleted(true);
    }
  }, [isOpen]);

  const handleGeneratePrompt = () => {
    const communityId = thread?.communityId;
    if (!communityId) {
      notifyError('Community ID is required for prompt generation');
      return;
    }
    setIsAIresponseCompleted(false);
    setPromptData('');
    let text = '';
    generateCompletion(
      {
        communityId,
        completionType: AICompletionType.PredictionMarket,
        threadId: thread?.id,
        model: DEFAULT_COMPLETION_MODEL,
        stream: true,
      },
      {
        onError: () => {
          notifyError('Failed to generate prompt');
          setIsAIresponseCompleted(true);
        },
        onChunk: (chunk) => {
          text += chunk;
          text = text.trim();
          setPromptData(text);
        },
        onComplete: () => setIsAIresponseCompleted(true),
      },
    ).catch(() => setIsAIresponseCompleted(true));
  };

  const handleClose = () => {
    setIsAIresponseCompleted(true);
    setPromptData('');
    onClose();
  };

  return (
    <CWModal
      size="medium"
      content={
        isOpen ? (
          <PredictionMarketEditorModal
            thread={thread}
            onModalClose={handleClose}
            onSuccess={handleClose}
            promptData={promptData}
            isAIresponseCompleted={isAIresponseCompleted}
            onGeneratePrompt={isAIEnabled ? handleGeneratePrompt : undefined}
          />
        ) : null
      }
      onClose={handleClose}
      open={isOpen}
    />
  );
};
