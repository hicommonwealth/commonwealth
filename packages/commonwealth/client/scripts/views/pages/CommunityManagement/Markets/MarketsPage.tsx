import React from 'react';
import app from 'state';
import { MarketSelector } from '../../../components/MarketIntegrations/MarketSelector';

const MarketsPage = () => {
  const communityId = app.activeChainId();

  if (!communityId) {
    return <p>Loading community...</p>;
  }

  return (
    <div>
      <h1>Marketplace Integrations</h1>
      <p>
        Find and subscribe to prediction markets from platforms like Kalshi.
      </p>
      <MarketSelector communityId={communityId} />
    </div>
  );
};

export default MarketsPage;
