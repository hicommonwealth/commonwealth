import { ChainBase } from '@hicommonwealth/shared';
import { useFlag } from 'client/scripts/hooks/useFlag';
import { useInitChainIfNeeded } from 'client/scripts/hooks/useInitChainIfNeeded';
import app from 'client/scripts/state';
import { useGetCommunityByIdQuery } from 'client/scripts/state/api/communities';
import {
  useActiveCosmosProposalsQuery,
  useCompletedCosmosProposalsQuery,
} from 'client/scripts/state/api/proposals';
import React, { useEffect, useState } from 'react';
import CWPageLayout from '../../components/component_kit/new_designs/CWPageLayout';
import { PageNotFound } from '../404';
import { PageLoading } from '../loading';
import GovernanceCards from './GovernanceCards';
import GovernanceHeader from './GovernanceHeader/GovernanceHeader';
import './GovernancePage.scss';
import ProposalListing from './ProposalListing/ProposalListing';

const GovernancePage = () => {
  const governancePageEnabled = useFlag('governancePage');

  const [isLoading, setLoading] = useState(
    !app.chain || !app.chain.loaded || !app.chain.apiInitialized,
  );
  useInitChainIfNeeded(app); // if chain is selected, but data not loaded, initialize it

  useEffect(() => {
    app.chainAdapterReady.on('ready', () => setLoading(false));

    return () => {
      app.chainAdapterReady.off('ready', () => {
        setLoading(false);
        app.chainAdapterReady.removeAllListeners();
      });
    };
  }, [setLoading]);

  const onCosmos = app.chain?.base === ChainBase.CosmosSDK;
  const onEtherem = app.chain?.base === ChainBase.Ethereum;

  const communityId = app.activeChainId() || '';
  const { data: community } = useGetCommunityByIdQuery({
    id: communityId,
    enabled: !!communityId,
  });

  const {
    data: activeCosmosProposals,
    isLoading: isLoadingActicCosmosProposal,
  } = useActiveCosmosProposalsQuery({
    isApiReady: !!app.chain?.apiInitialized,
  });
  const {
    data: completedCosmosProposals,
    isLoading: isLoadingCompletedCosmosProposal,
  } = useCompletedCosmosProposalsQuery({
    isApiReady: !!app.chain?.apiInitialized,
  });

  const snapshotst = community?.snapshot_spaces || [];

  console.log('snapshotst :', snapshotst);

  if (isLoading) {
    if (app.chain?.failed) {
      return (
        <PageNotFound
          title="Wrong Ethereum Provider Network!"
          message="Change Metamask to point to Ethereum Mainnet"
        />
      );
    }

    return <PageLoading message="Connecting to chain" />;
  }

  if (isLoadingActicCosmosProposal || isLoadingCompletedCosmosProposal)
    return <PageLoading message="Connecting to chain" />;

  const activeProposalsCount = activeCosmosProposals?.length || 0;
  const inactiveProposalsCount =
    onCosmos && completedCosmosProposals ? completedCosmosProposals.length : 0;
  const totalProposalsCount = activeProposalsCount + inactiveProposalsCount;

  if (!governancePageEnabled && (!onEtherem || !onCosmos)) {
    return <PageNotFound />;
  }

  return (
    <CWPageLayout>
      <div className="GovernancePage">
        <GovernanceHeader />
        <GovernanceCards totalProposals={totalProposalsCount} />
        <ProposalListing
          activeCosmosProposals={activeCosmosProposals}
          completedCosmosProposals={completedCosmosProposals}
        />
      </div>
    </CWPageLayout>
  );
};

export default GovernancePage;
