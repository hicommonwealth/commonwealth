import React, { useState } from 'react';

import { useFlag } from 'hooks/useFlag';
import type Thread from '../../../models/Thread';
import { CWContentPageCard } from '../../components/component_kit/CWContentPageCard';
import { CWButton } from '../../components/component_kit/new_designs/CWButton';
import { CWModal } from '../../components/component_kit/new_designs/CWModal';
import { PredictionMarketEditorModal } from '../../modals/PredictionMarketEditorModal';
import { useGetPredictionMarketsQuery } from 'state/api/predictionMarket';
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
    limit: 1,
    offset: 0,
  });

  const results = (marketsData as { results?: unknown[] } | undefined)?.results;
  const hasPredictionMarket = Array.isArray(results) && results.length > 0;

  if (!isFutarchyEnabled || !thread?.id) return null;
  if (hasPredictionMarket) return null;

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
