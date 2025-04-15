import { notifyError } from 'client/scripts/controllers/app/notifications';
import { useAiCompletion } from 'client/scripts/state/api/ai';
import { generatePollPrompt } from 'client/scripts/state/api/ai/prompts';
import React, { useState } from 'react';
import type Thread from '../../../models/Thread';
import { CWContentPageCard } from '../../components/component_kit/CWContentPageCard';
import { CWButton } from '../../components/component_kit/new_designs/CWButton';
import { CWModal } from '../../components/component_kit/new_designs/CWModal';
import { PollEditorModal } from '../../modals/poll_editor_modal';
import './poll_cards.scss';

type ThreadPollEditorCardProps = {
  thread: Thread;
  threadAlreadyHasPolling: boolean;
};

export const ThreadPollEditorCard = ({
  thread,
  threadAlreadyHasPolling,
}: ThreadPollEditorCardProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pollData, setPollData] = useState<any>();

  const [isAIresponseCompleted, setIsAIresponseCompleted] = useState(false);

  const { generateCompletion } = useAiCompletion();

  const handleGeneratePoll = () => {
    let text = '';
    const context = `
    Thread: ${thread?.title || ''}
    ${`body ${thread.body}`}
    `;

    setPollData(text);
    const prompt = generatePollPrompt(context);

    generateCompletion(prompt, {
      model: 'gpt-4o-mini',
      stream: true,
      onError: (error) => {
        console.error('Error generating AI comment:', error);
        notifyError('Failed to generate AI comment');
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
      console.error('Failed to generate comment:', error);
    });
  };

  return (
    <>
      <CWContentPageCard
        header={`Add ${
          threadAlreadyHasPolling ? 'an' : 'another'
        } offchain poll to this
        thread?`}
        content={
          <div className="PollEditorCard">
            <CWButton
              buttonHeight="sm"
              className="create-poll-button"
              label="Create poll"
              onClick={(e) => {
                e.preventDefault();
                setIsModalOpen(true);
                handleGeneratePoll();
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
            onModalClose={() => setIsModalOpen(false)}
            pollData={pollData}
            isAIresponseCompleted={isAIresponseCompleted}
          />
        }
        onClose={() => {
          setIsModalOpen(false);
          setIsAIresponseCompleted(false);
          setPollData('');
        }}
        open={isModalOpen}
      />
    </>
  );
};
