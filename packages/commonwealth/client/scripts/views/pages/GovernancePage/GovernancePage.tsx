import { ChainBase } from '@hicommonwealth/shared';
import { useFlag } from 'client/scripts/hooks/useFlag';
import app from 'client/scripts/state';
import { useGetCommunityByIdQuery } from 'client/scripts/state/api/communities';
import React from 'react';
import CWPageLayout from '../../components/component_kit/new_designs/CWPageLayout';
import { PageNotFound } from '../404';
import GovernanceCards from './GovernanceCards';
import GovernanceHeader from './GovernanceHeader/GovernanceHeader';
import './GovernancePage.scss';

const GovernancePage = () => {
  const governancePageEnabled = useFlag('governancePage');

  const communityId = app.activeChainId() || '';
  const { data: community } = useGetCommunityByIdQuery({
    id: communityId,
    enabled: !!communityId,
  });

  if (!governancePageEnabled || community?.base !== ChainBase.Ethereum) {
    return <PageNotFound />;
  }

  return (
    <CWPageLayout>
      <div className="GovernancePage">
        <GovernanceHeader />
        <GovernanceCards />
      </div>
    </CWPageLayout>
  );
};

export default GovernancePage;
