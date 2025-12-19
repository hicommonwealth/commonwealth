import {
  notifyError,
  notifySuccess,
} from 'client/scripts/controllers/app/notifications';
import app from 'client/scripts/state';
import { trpc } from 'client/scripts/utils/trpcClient';
import { CWCard } from 'client/scripts/views/components/component_kit/cw_card';
import { CWText } from 'client/scripts/views/components/component_kit/cw_text';
import { CWButton } from 'client/scripts/views/components/component_kit/new_designs/CWButton';
import CWCircleMultiplySpinner from 'client/scripts/views/components/component_kit/new_designs/CWCircleMultiplySpinner';
import { CWTag } from 'client/scripts/views/components/component_kit/new_designs/CWTag';
import React from 'react';

import './MarketsAppPage.scss'; // Import the new SCSS file

const MarketsAppPage: React.FC = () => {
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <CWCircleMultiplySpinner />
      </div>
    );
  }

  if (error) {
    notifyError(`Error fetching markets: ${error.message}`);
    return null;
  }

  return (
    <div>
      <CWText type="h4" fontWeight="semiBold" className="mb-4">
        Markets
      </CWText>
      <div className="px-4">
        {' '}
        {/* Outer padding */}
        <div className="markets-grid-container">
          {markets &&
            markets.map((market) => (
              <CWCard
                key={market.id}
                elevation="elevation-2"
                className="p-4 flex flex-col justify-between h-full w-full"
              >
                <div className="flex flex-col h-full">
                  <div className="flex-grow">
                    <div className="flex items-center justify-between mb-2">
                      <CWTag type="info" label={market.category} />
                    </div>
                    <CWText fontWeight="semiBold">{market.question}</CWText>
                  </div>
                  <div className="flex justify-end mt-4">
                    <CWButton
                      label="Unsubscribe"
                      onClick={() => handleUnsubscribe(market.slug)}
                      buttonType="destructive"
                      disabled={unsubscribeMarketMutation.isPending}
                    />
                  </div>
                </div>
              </CWCard>
            ))}
        </div>
      </div>
      {markets && markets.length === 0 && (
        <CWText>No markets subscribed.</CWText>
      )}
    </div>
  );
};

export default MarketsAppPage;
