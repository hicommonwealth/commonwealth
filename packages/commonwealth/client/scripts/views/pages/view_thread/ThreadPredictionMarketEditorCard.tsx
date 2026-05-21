import { PredictionMarketStatus } from '@hicommonwealth/schemas';
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
import {
  type PredictionMarketResult,
  ThreadPredictionMarketCard,
} from './ThreadPredictionMarketCard';
import './poll_cards.scss';

type ThreadPredictionMarketEditorCardProps = {
  thread: Thread;
  isAuthor?: boolean;
  isAdmin?: boolean;
};

export const ThreadPredictionMarketEditorCard = ({
  thread,
  isAuthor = false,
  isAdmin = false,
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
  const activeMarket = markets.find(
    (m) =>
      (m as { status?: string }).status !== PredictionMarketStatus.Cancelled,
  );

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

  const canResolveMarket = isAuthor || isAdmin;

  if (activeMarket) {
    return (
      <>
        {markets
          .filter(
            (market) =>
              (market as unknown as PredictionMarketResult).status !==
              PredictionMarketStatus.Cancelled,
          )
          .map((market) => (
            <ThreadPredictionMarketCard
              key={(market as PredictionMarketResult).id}
              thread={thread}
              market={market as PredictionMarketResult}
              isAuthor={isAuthor}
              canResolveMarket={canResolveMarket}
            />
          ))}
      </>
    );
  }

  if (!activeMarket && !isAuthor) {
    return null;
  }

  if (!activeMarket) {
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
                onGeneratePrompt={
                  isAIEnabled ? handleGeneratePrompt : undefined
                }
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
  }

  return null;
};
