import { PredictionMarketStatus } from '@hicommonwealth/schemas';
import { useFlag } from 'client/scripts/hooks/useFlag';
import type Thread from 'client/scripts/models/Thread';
import app from 'client/scripts/state';
import { useGetPredictionMarketsQuery } from 'client/scripts/state/api/predictionMarket';
import Permissions from 'client/scripts/utils/Permissions';
import React, { useState } from 'react';
import { ParticipationPromoCard } from '../ParticipationPromoCard';
import { ThreadPredictionMarketEditorCard } from '../ThreadPredictionMarketEditorCard';
import { CreatePredictionMarket } from './CreatePredictionMarket';

export type PredictionMarketCardProps = {
  thread: Thread;
};

export const PredictionMarketCard = ({ thread }: PredictionMarketCardProps) => {
  const futarchyEnabled = useFlag('futarchy');
  const communityId = app.activeChainId() || '';
  const [createOpen, setCreateOpen] = useState(false);

  const isAuthor = !!thread && Permissions.isThreadAuthor(thread);
  const isAdmin = Permissions.isSiteAdmin() || Permissions.isCommunityAdmin();
  const isAdminOrMod = isAdmin || Permissions.isCommunityModerator();

  const { data: marketsData } = useGetPredictionMarketsQuery({
    thread_id: thread.id!,
    limit: 10,
    apiCallEnabled: futarchyEnabled && !!thread.id && !!communityId,
  });

  const results = (marketsData as { results?: unknown[] } | undefined)?.results;
  const hasActiveMarket =
    Array.isArray(results) &&
    results.some(
      (m) =>
        (m as { status?: string }).status !== PredictionMarketStatus.Cancelled,
    );

  const showAdminPromo = isAdminOrMod && futarchyEnabled && !hasActiveMarket;

  if (!futarchyEnabled || !thread.id) {
    return null;
  }

  return (
    <>
      {showAdminPromo && (
        <>
          <ParticipationPromoCard
            title="Prediction market"
            description="Spin up a market so the community can trade on an outcome tied to this thread."
            ctaLabel="Create prediction market"
            onCtaClick={() => setCreateOpen(true)}
          />
          <CreatePredictionMarket
            thread={thread}
            isOpen={createOpen}
            onClose={() => setCreateOpen(false)}
          />
        </>
      )}
      <ThreadPredictionMarketEditorCard
        thread={thread}
        isAuthor={isAuthor}
        isAdmin={isAdmin}
      />
    </>
  );
};
