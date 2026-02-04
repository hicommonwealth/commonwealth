import React from 'react';
import app from 'state';
import { MarketSelector } from '../../../components/MarketIntegrations/MarketSelector';
import './MarketsPage.scss'; // Import the new SCSS file

const MarketsPage = () => {
  const communityId = app.activeChainId();

  if (!communityId) {
    return <></>;
  }

  return (
    <div className="markets-page-container">
      <MarketSelector communityId={communityId} />
    </div>
  );
};

export default MarketsPage;
