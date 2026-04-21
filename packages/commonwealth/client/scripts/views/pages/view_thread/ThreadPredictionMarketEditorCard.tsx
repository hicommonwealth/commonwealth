import { PredictionMarketStatus } from '@hicommonwealth/schemas';
import { useFlag } from 'client/scripts/hooks/useFlag';
import type Thread from 'client/scripts/models/Thread';
import React from 'react';
import { useGetPredictionMarketsQuery } from 'state/api/predictionMarket';
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

  return null;
};
