import React, { useState } from 'react';

import { useFlag } from 'hooks/useFlag';
import { useGetPredictionMarketsQuery } from 'state/api/predictionMarket';
import type Thread from '../../../models/Thread';
import { CWContentPageCard } from '../../components/component_kit/CWContentPageCard';
import { CWButton } from '../../components/component_kit/new_designs/CWButton';
import { CWModal } from '../../components/component_kit/new_designs/CWModal';
import { PredictionMarketEditorModal } from '../../modals/PredictionMarketEditorModal';
import { ThreadPredictionMarketCard } from './ThreadPredictionMarketCard';
import './poll_cards.scss';

type ThreadPredictionMarketEditorCardProps = {
  thread: Thread;
};

export const ThreadPredictionMarketEditorCard = ({
  thread,
}: ThreadPredictionMarketEditorCardProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isFutarchyEnabled = useFlag('futarchy');
  const { data: marketsData } = useGetPredictionMarketsQuery({
    thread_id: thread.id!,
    limit: 10,
  });

  const results = (marketsData as { results?: unknown[] } | undefined)?.results;
  const markets = Array.isArray(results) ? results : [];
  const hasPredictionMarket = markets.length > 0;

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
              }}
            />
          </div>
        }
      />
      <CWModal
        size="medium"
        content={
          <PredictionMarketEditorModal
            thread={thread}
            onModalClose={() => setIsModalOpen(false)}
            onSuccess={() => setIsModalOpen(false)}
          />
        }
        onClose={() => setIsModalOpen(false)}
        open={isModalOpen}
      />
    </>
  );
};
