import { DEFAULT_COMPLETION_MODEL } from '@hicommonwealth/shared';
import { notifyError } from 'client/scripts/controllers/app/notifications';
import { AICompletionType, useAiCompletion } from 'client/scripts/state/api/ai';
import React, { useState } from 'react';
import { useAIFeatureEnabled } from 'state/ui/user';
import { SetLocalPolls } from 'utils/polls';
import type Thread from '../../../models/Thread';
import { CWContentPageCard } from '../../components/component_kit/CWContentPageCard';
import { CWButton } from '../../components/component_kit/new_designs/CWButton';
import { CWModal } from '../../components/component_kit/new_designs/CWModal';
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
}: ThreadPollEditorCardProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pollData, setPollData] = useState<string>();

  const [isAIresponseCompleted, setIsAIresponseCompleted] = useState(true);

  const { generateCompletion } = useAiCompletion();
  const { isAIEnabled } = useAIFeatureEnabled();

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
        onError: (error) => {
          console.error('Error generating Poll:', error);
          notifyError('Failed to generate Poll');
          setIsAIresponseCompleted(true);
        },
        onChunk: (chunk) => {
          text += chunk;
          text = text.trim();
          setPollData(text);
        },
        onComplete: () => {
          setIsAIresponseCompleted(true);
        },
      },
    ).catch((error) => {
      console.error('Failed to generate poll:', error);
      setIsAIresponseCompleted(true);
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
            onGeneratePoll={isAIEnabled ? handleGeneratePoll : undefined}
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
