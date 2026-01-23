import {
  notifyError,
  notifySuccess,
} from 'client/scripts/controllers/app/notifications';
import app from 'client/scripts/state';
import { trpc } from 'client/scripts/utils/trpcClient';
import { CWText } from 'client/scripts/views/components/component_kit/cw_text';
import CWCircleMultiplySpinner from 'client/scripts/views/components/component_kit/new_designs/CWCircleMultiplySpinner';
import CWPageLayout from 'client/scripts/views/components/component_kit/new_designs/CWPageLayout';
import {
  MarketCard,
  MarketCardData,
} from 'client/scripts/views/components/MarketIntegrations/MarketCard';
import { MarketProvider } from 'client/scripts/views/components/MarketIntegrations/types';
import React from 'react';

import './MarketsAppPage.scss';

const MarketsAppPage = () => {
  const community_id = app.activeChainId() || '';
  const utils = trpc.useUtils();

  const {
    data: markets,
    isLoading,
    error,
  } = trpc.community.getMarkets.useQuery(
    {
      community_id,
    },
    {
      enabled: !!community_id,
    },
  );

  const unsubscribeMarketMutation =
    trpc.community.unsubscribeMarket.useMutation({
      onSuccess: () => {
        notifySuccess('Unsubscribed from market successfully!');
        void utils.community.getMarkets.invalidate({ community_id });
      },
      onError: (err) => {
        notifyError(`Failed to unsubscribe: ${err.message}`);
      },
    });

  const handleUnsubscribe = (market: MarketCardData) => {
    unsubscribeMarketMutation.mutate({ community_id, slug: market.slug });
  };

  // Convert backend market data to MarketCardData format
  const toMarketCardData = (
    market: NonNullable<typeof markets>[number],
  ): MarketCardData => ({
    slug: market.slug,
    provider: market.provider as MarketProvider,
    question: market.question,
    category: market.category,
    status: market.status,
    imageUrl: market.image_url,
    startTime: market.start_time,
    endTime: market.end_time,
  });

  if (isLoading) {
    return (
      <CWPageLayout>
        <section className="MarketsAppPage">
          <div className="markets-loading">
            <CWCircleMultiplySpinner />
          </div>
        </section>
      </CWPageLayout>
    );
  }

  if (error) {
    notifyError(`Error fetching markets: ${error.message}`);
    return (
      <CWPageLayout>
        <section className="MarketsAppPage">
          <div className="markets-header">
            <CWText type="h3" fontWeight="bold" className="markets-title">
              Markets
            </CWText>
            <CWText type="b1" className="markets-subtitle">
              Track and manage your subscribed prediction markets
            </CWText>
          </div>
        </section>
      </CWPageLayout>
    );
  }

  return (
    <CWPageLayout>
      <section className="MarketsAppPage">
        <div className="markets-header">
          <CWText type="h3" fontWeight="bold" className="markets-title">
            Markets
          </CWText>
          <CWText type="b1" className="markets-subtitle">
            Track and manage your subscribed prediction markets
          </CWText>
        </div>

        {(markets && markets?.length === 0) || !markets ? (
          <div className="markets-empty-state">
            <CWText type="h5" className="empty-state-title">
              No markets subscribed
            </CWText>
            <CWText type="b2" className="empty-state-description">
              You haven&apos;t subscribed to any markets yet. Explore markets to
              get started.
            </CWText>
          </div>
        ) : (
          <div className="markets-grid">
            {markets.map((market) => (
              <MarketCard
                key={market.slug}
                market={toMarketCardData(market)}
                isSubscribed={true}
                onUnsubscribe={handleUnsubscribe}
                isLoading={unsubscribeMarketMutation.isPending}
              />
            ))}
          </div>
        )}
      </section>
    </CWPageLayout>
  );
};

export default MarketsAppPage;
