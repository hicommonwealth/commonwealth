import { notifyError, notifySuccess } from 'controllers/app/notifications';
import React from 'react';
import app from 'state';
import { trpc } from 'utils/trpcClient';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import CWCircleMultiplySpinner from 'views/components/component_kit/new_designs/CWCircleMultiplySpinner';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import {
  MarketCard,
  MarketCardData,
} from 'views/components/MarketIntegrations/MarketCard';
import { MarketProvider } from 'views/components/MarketIntegrations/types';
import './MarketsAppPage.scss';

const MarketsAppPage = () => {
  const community_id = app.activeChainId() || '';
  const utils = trpc.useUtils();

  const {
    data: marketsData,
    isInitialLoading,
    error,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = trpc.community.getMarkets.useInfiniteQuery(
    {
      community_id,
      limit: 20,
    },
    {
      enabled: !!community_id,
      initialCursor: 1,
      getNextPageParam: (lastPage) => {
        const nextPageNum = lastPage.page + 1;
        if (nextPageNum <= lastPage.totalPages) {
          return nextPageNum;
        }
        return undefined;
      },
    },
  );

  const markets = marketsData?.pages.flatMap((page) => page.results) || [];

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

  if (isInitialLoading) {
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
          <>
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
            {isFetchingNextPage && (
              <div className="markets-loading">
                <CWCircleMultiplySpinner />
              </div>
            )}
            {hasNextPage && !isFetchingNextPage && (
              <div className="load-more-container">
                <CWButton
                  label="See more"
                  buttonType="tertiary"
                  containerClassName="ml-auto"
                  onClick={() => {
                    void fetchNextPage();
                  }}
                />
              </div>
            )}
          </>
        )}
      </section>
    </CWPageLayout>
  );
};

export default MarketsAppPage;
