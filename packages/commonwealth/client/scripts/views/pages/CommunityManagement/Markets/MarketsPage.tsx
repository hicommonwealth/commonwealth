import React from 'react';
import app from 'state';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import { MarketSelector } from '../../../components/MarketIntegrations/MarketSelector';
import './MarketsPage.scss'; // Import the new SCSS file

const MarketsPage = () => {
  const communityId = app.activeChainId();

  if (!communityId) {
    return <></>;
  }

  return (
    <CWPageLayout>
      <div className="markets-page-container">
        <MarketSelector communityId={communityId} />
      </div>
    </CWPageLayout>
  );
};

export default MarketsPage;
