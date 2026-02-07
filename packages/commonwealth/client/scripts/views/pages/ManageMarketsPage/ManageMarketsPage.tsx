import { useFlag } from 'hooks/useFlag';
import React from 'react';
import Permissions from 'utils/Permissions';
import CWPageLayout from '../../components/component_kit/new_designs/CWPageLayout';
import { MarketSelector } from '../../components/MarketIntegrations/MarketSelector';
import { PageNotFound } from '../404';
import './ManageMarketsPage.scss';

const ManageMarketsPage = () => {
  const marketsEnabled = useFlag('markets');

  if (!Permissions.isSiteAdmin() || !marketsEnabled) {
    return <PageNotFound />;
  }

  return (
    <CWPageLayout>
      <div className="markets-page-container">
        <MarketSelector />
      </div>
    </CWPageLayout>
  );
};

export default ManageMarketsPage;
