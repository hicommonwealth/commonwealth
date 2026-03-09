import React from 'react';

import type Thread from 'client/scripts/models/Thread';
import { useGetPredictionMarketsQuery } from 'state/api/predictionMarket';

import type { ThreadPredictionMarketTagMarket } from './ThreadPredictionMarketTag';
import ThreadPredictionMarketTag from './ThreadPredictionMarketTag';

interface ThreadPredictionMarketTagContainerProps {
  thread: Thread;
}

const ThreadPredictionMarketTagContainer = ({
  thread,
}: ThreadPredictionMarketTagContainerProps) => {
  const threadId = thread?.id;
  const { data: marketsData } = useGetPredictionMarketsQuery({
    thread_id: threadId ?? 0,
    limit: 1,
  });

  const results = (marketsData as { results?: unknown[] } | undefined)?.results;
  const markets = Array.isArray(results) ? results : [];
  const hasPredictionMarket = markets.length > 0;

  // Only show tag for active or resolved markets (not draft/cancelled) in feed
  const displayMarket = markets[0] as
    | ThreadPredictionMarketTagMarket
    | undefined;
  const showTag =
    hasPredictionMarket &&
    displayMarket &&
    (displayMarket.status === 'active' || displayMarket.status === 'resolved');

  if (!showTag || !displayMarket) return null;

  return <ThreadPredictionMarketTag market={displayMarket} />;
};

export default ThreadPredictionMarketTagContainer;
