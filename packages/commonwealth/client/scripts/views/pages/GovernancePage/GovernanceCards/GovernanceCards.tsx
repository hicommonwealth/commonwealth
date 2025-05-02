import React from 'react';
import GovernanceMember from './GovernanceMember/GovernanceMember';
import GovernanceProposalCard from './GovernanceProposal/GovernanceProposalCard';
import GovernanceTresury from './GovernanceTreasury/GovernanceTreasury';
import GovernanceUserProfile from './GovernanceUserProfile/GovernanceUserProfile';

import './GovernanceCards.scss';

interface GovernaceCardsProps {
  totalProposals?: number;
}

const GovernanceCards = ({ totalProposals }: GovernaceCardsProps) => {
  return (
    <div className="GovernanceCards">
      <GovernanceMember />
      <GovernanceTresury />
      <GovernanceProposalCard totalProposals={totalProposals} />
      <GovernanceUserProfile />
    </div>
  );
};

export default GovernanceCards;
