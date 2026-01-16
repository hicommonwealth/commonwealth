import {
  notifyError,
  notifySuccess,
} from 'client/scripts/controllers/app/notifications';
import app from 'client/scripts/state';
import { trpc } from 'client/scripts/utils/trpcClient';
import { CWIcon } from 'client/scripts/views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'client/scripts/views/components/component_kit/cw_text';
import { CWButton } from 'client/scripts/views/components/component_kit/new_designs/CWButton';
import CWCircleMultiplySpinner from 'client/scripts/views/components/component_kit/new_designs/CWCircleMultiplySpinner';
import CWPageLayout from 'client/scripts/views/components/component_kit/new_designs/CWPageLayout';
import { CWTag } from 'client/scripts/views/components/component_kit/new_designs/CWTag';
import { getExternalMarketUrl } from 'client/scripts/views/components/MarketIntegrations/types';
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
        utils.community.getMarkets.invalidate({ community_id });
      },
      onError: (err) => {
        notifyError(`Failed to unsubscribe: ${err.message}`);
      },
    });

  const handleUnsubscribe = (slug: string) => {
    unsubscribeMarketMutation.mutate({ community_id, slug });
  };

  const getStatusTagType = (status: string): 'active' | 'new' | 'info' => {
    switch (status) {
      case 'open':
        return 'active';
      case 'closed':
        return 'new';
      case 'settled':
        return 'info';
      default:
        return 'info';
    }
  };

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(dateObj);
  };

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
          <div className="markets-grid-container">
            {markets.map((market) => (
              <div key={market.id} className="market-card">
                <div className="market-card-content">
                  <div className="market-card-header">
                    <div className="market-tags">
                      <CWTag
                        type="info"
                        label={market.category}
                        classNames="category-tag"
                      />
                      <CWTag
                        type={getStatusTagType(market.status)}
                        label={market.status.toUpperCase()}
                        classNames="status-tag"
                      />
                    </div>
                    <div className="market-provider">
                      <a
                        href={getExternalMarketUrl(
                          market.provider,
                          market.slug,
                          market.question,
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="provider-link"
                        aria-label={`View on ${market.provider}`}
                      >
                        <span className="provider-badge">
                          {market.provider}
                        </span>
                        <CWIcon iconName="externalLink" iconSize="small" />
                      </a>
                    </div>
                  </div>

                  <div className="market-question">
                    <CWText fontWeight="semiBold" type="h5">
                      {market.question}
                    </CWText>
                  </div>

                  <div className="market-date-chip">
                    <CWTag
                      type="info"
                      label={`From ${formatDate(market.start_time)} to ${formatDate(market.end_time)}`}
                      classNames="date-tag"
                    />
                  </div>

                  <div className="market-card-footer">
                    <CWButton
                      label="Unsubscribe"
                      onClick={() => handleUnsubscribe(market.slug)}
                      buttonType="destructive"
                      disabled={unsubscribeMarketMutation.isPending}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </CWPageLayout>
  );
};

export default MarketsAppPage;
