import { ChainBase } from '@hicommonwealth/shared';
import { CosmosProposal } from 'client/scripts/controllers/chain/cosmos/gov/v1beta1/proposal-v1beta1';
import React from 'react';
import CWPageLayout from '../../components/component_kit/new_designs/CWPageLayout';
import GovernanceCards from './GovernanceCards';
import GovernanceHeader from './GovernanceHeader/GovernanceHeader';
import './GovernancePage.scss';
import ProposalListing from './ProposalListing/ProposalListing';

type GovernancePageContentProps = {
  activeCosmosProposals: CosmosProposal[] | undefined;
  chain: ChainBase.CosmosSDK | ChainBase.Ethereum;
  completedCosmosProposals: CosmosProposal[] | undefined;
  totalProposalsCount: number;
};

const GovernancePageContent = ({
  activeCosmosProposals,
  chain,
  completedCosmosProposals,
  totalProposalsCount,
}: GovernancePageContentProps) => (
  <CWPageLayout>
    <div className="GovernancePage">
      <GovernanceHeader />
      <GovernanceCards totalProposals={totalProposalsCount} />
      <ProposalListing
        chain={chain}
        activeCosmosProposals={activeCosmosProposals}
        completedCosmosProposals={completedCosmosProposals}
      />
    </div>
  </CWPageLayout>
);

export default GovernancePageContent;
