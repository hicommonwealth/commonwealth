import React from 'react';
import { LoadingIndicator } from '../../components/LoadingIndicator/LoadingIndicator';
import { PageNotFound } from '../404';
import GovernancePageContent from './GovernancePageContent';
import { useGovernancePageData } from './useGovernancePageData';

const GovernancePage = () => {
  const {
    activeCosmosProposals,
    chain,
    completedCosmosProposals,
    status,
    totalProposalsCount,
  } = useGovernancePageData();

  if (status === 'loading') {
    return <LoadingIndicator message="Connecting to chain" />;
  }

  if (status === 'network-error') {
    return (
      <PageNotFound
        title="Wrong Ethereum Provider Network!"
        message="Change Metamask to point to Ethereum Mainnet"
      />
    );
  }

  if (status === 'not-found') {
    return <PageNotFound />;
  }

  return (
    <GovernancePageContent
      chain={chain}
      activeCosmosProposals={activeCosmosProposals}
      completedCosmosProposals={completedCosmosProposals}
      totalProposalsCount={totalProposalsCount}
    />
  );
};

export default GovernancePage;
