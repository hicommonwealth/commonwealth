import { notifyError } from 'client/scripts/controllers/app/notifications';
import { useAiCompletion } from 'client/scripts/state/api/ai';
import { generatePollPrompt } from 'client/scripts/state/api/ai/prompts';
import { useAIFeatureEnabled } from 'hooks/useAIFeatureEnabled';
import React, { useState } from 'react';
import { SetLocalPolls } from 'utils/polls';
import type Thread from '../../../models/Thread';
import { CWContentPageCard } from '../../components/component_kit/CWContentPageCard';
import { CWButton } from '../../components/component_kit/new_designs/CWButton';
import { CWModal } from '../../components/component_kit/new_designs/CWModal';
import { getTextFromDelta } from '../../components/react_quill_editor';
import { serializeDelta } from '../../components/react_quill_editor/utils';
import { PollEditorModal } from '../../modals/poll_editor_modal';
import './poll_cards.scss';

type ThreadPollEditorCardProps = {
  thread?: Thread;
  threadAlreadyHasPolling: boolean;
  setLocalPoll?: SetLocalPolls;
  isCreateThreadPage?: boolean;
  threadContentDelta?: string;
  threadTitle?: string;
};

export const ThreadPollEditorCard = ({
  thread,
  threadAlreadyHasPolling,
  setLocalPoll,
  isCreateThreadPage = false,
  threadTitle,
  threadContentDelta,
}: ThreadPollEditorCardProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pollData, setPollData] = useState<string>();

  const [isAIresponseCompleted, setIsAIresponseCompleted] = useState(true);

  const { generateCompletion } = useAiCompletion();
  const { isAIEnabled } = useAIFeatureEnabled();
  const DEFAULT_THREAD_TITLE = 'Untitled Discussion';
  const DEFAULT_THREAD_BODY = 'No content provided.';
  const handleGeneratePoll = () => {
    setIsAIresponseCompleted(false);
    setPollData('');
    let effectiveTitle;
    let effectiveBody;

    if (isCreateThreadPage && threadContentDelta && threadTitle) {
      effectiveTitle = isAIEnabled
        ? threadTitle?.trim() || DEFAULT_THREAD_TITLE
        : threadTitle;

      effectiveBody = isAIEnabled
        ? getTextFromDelta(threadContentDelta).trim()
          ? serializeDelta(threadContentDelta)
          : DEFAULT_THREAD_BODY
        : serializeDelta(threadContentDelta);
    }

    let text = '';
    const context = `
    Thread: ${thread?.title || effectiveTitle || ''}
    body ${thread?.body || effectiveBody || ''}
    `;

    setPollData(text);
    const { systemPrompt, userPrompt } = generatePollPrompt(context);

    generateCompletion(userPrompt, {
      model: 'gpt-4o-mini',
      stream: true,
      systemPrompt,
      onError: (error) => {
        console.error('Error generating Poll:', error);
        notifyError('Failed to generate  Poll');
      },
      onChunk: (chunk) => {
        text += chunk;
        text = text.trim();
        setPollData(text);
      },
      onComplete: () => {
        setIsAIresponseCompleted(true);
      },
    }).catch((error) => {
      console.error('Failed to generate poll:', error);
    });
  };

  return (
    <>
      <CWContentPageCard
        header={`Add ${
          threadAlreadyHasPolling ? 'an' : 'another'
        } offchain poll to this
        thread?`}
        showCollapsedIcon={true}
        content={
          <div className="PollEditorCard">
            <CWButton
              buttonHeight="sm"
              className="create-poll-button"
              label="Create poll"
              onClick={(e) => {
                e.preventDefault();
                setIsModalOpen(true);
                setIsAIresponseCompleted(true);
                setPollData('');
              }}
            />
          </div>
        }
      />
      <CWModal
        size="medium"
        content={
          <PollEditorModal
            thread={thread}
            onModalClose={() => {
              setIsModalOpen(false);
              setIsAIresponseCompleted(true);
              setPollData('');
            }}
            pollData={pollData}
            isAIresponseCompleted={isAIresponseCompleted}
            onGeneratePoll={handleGeneratePoll}
            setLocalPoll={setLocalPoll}
          />
        }
        onClose={() => {
          setIsModalOpen(false);
          setIsAIresponseCompleted(true);
          setPollData('');
        }}
        open={isModalOpen}
      />
    </>
  );
};
