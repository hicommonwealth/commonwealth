import { DEFAULT_COMPLETION_MODEL } from '@hicommonwealth/shared';
import { notifyError } from 'client/scripts/controllers/app/notifications';
import { useFlag } from 'client/scripts/hooks/useFlag';
import type Thread from 'client/scripts/models/Thread';
import { AICompletionType, useAiCompletion } from 'client/scripts/state/api/ai';
import React, { useState } from 'react';
import { useGetPredictionMarketsQuery } from 'state/api/predictionMarket';
import { useAIFeatureEnabled } from 'state/ui/user';
import { CWContentPageCard } from '../../components/component_kit/CWContentPageCard';
import { CWButton } from '../../components/component_kit/new_designs/CWButton';
import { CWModal } from '../../components/component_kit/new_designs/CWModal';
import { PredictionMarketEditorModal } from '../../modals/PredictionMarket/PredictionMarketEditorModal';
import { ThreadPredictionMarketCard } from './ThreadPredictionMarketCard';
import './poll_cards.scss';

type ThreadPredictionMarketEditorCardProps = {
  thread: Thread;
};

export const ThreadPredictionMarketEditorCard = ({
  thread,
}: ThreadPredictionMarketEditorCardProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [promptData, setPromptData] = useState('');
  const [isAIresponseCompleted, setIsAIresponseCompleted] = useState(true);

  const { generateCompletion } = useAiCompletion();
  const { isAIEnabled } = useAIFeatureEnabled();
  const isFutarchyEnabled = useFlag('futarchy');
  const { data: marketsData } = useGetPredictionMarketsQuery({
    thread_id: thread.id!,
    limit: 10,
  });

  const results = (marketsData as { results?: unknown[] } | undefined)?.results;
  const markets = Array.isArray(results) ? results : [];
  const hasPredictionMarket = markets.length > 0;

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
        onError: (error) => {
          console.error('Error generating prediction market prompt:', error);
          notifyError('Failed to generate prompt');
          setIsAIresponseCompleted(true);
        },
        onChunk: (chunk) => {
          text += chunk;
          text = text.trim();
          setPromptData(text);
        },
        onComplete: () => {
          setIsAIresponseCompleted(true);
        },
      },
    ).catch((error) => {
      console.error('Failed to generate prediction market prompt:', error);
      setIsAIresponseCompleted(true);
    });
  };

  if (!isFutarchyEnabled || !thread?.id) return null;

  if (hasPredictionMarket) {
    return (
      <>
        {markets.map((market) => (
          <ThreadPredictionMarketCard
            key={(market as { id: number }).id}
            thread={thread}
            market={
              market as {
                id: number;
                thread_id: number;
                prompt: string;
                status: string;
                duration?: number;
                resolution_threshold?: number;
                collateral_address?: string;
                [key: string]: unknown;
              }
            }
            isAuthor={true}
          />
        ))}
      </>
    );
  }

  return (
    <>
      <CWContentPageCard
        header="Add a prediction market to this thread?"
        showCollapsedIcon={true}
        content={
          <div className="PollEditorCard">
            <CWButton
              buttonHeight="sm"
              className="create-poll-button"
              label="Create prediction market"
              onClick={(e) => {
                e.preventDefault();
                setIsModalOpen(true);
                setIsAIresponseCompleted(true);
                setPromptData('');
              }}
            />
          </div>
        }
      />
      <CWModal
        size="medium"
        content={
          isModalOpen ? (
            <PredictionMarketEditorModal
              thread={thread}
              onModalClose={() => {
                setIsModalOpen(false);
                setIsAIresponseCompleted(true);
                setPromptData('');
              }}
              onSuccess={() => setIsModalOpen(false)}
              promptData={promptData}
              isAIresponseCompleted={isAIresponseCompleted}
              onGeneratePrompt={isAIEnabled ? handleGeneratePrompt : undefined}
            />
          ) : null
        }
        onClose={() => {
          setIsModalOpen(false);
          setIsAIresponseCompleted(true);
          setPromptData('');
        }}
        open={isModalOpen}
      />
    </>
  );
};
