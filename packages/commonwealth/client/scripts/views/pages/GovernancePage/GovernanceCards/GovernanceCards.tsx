import React from 'react';
import GovernanceMember from './GovernanceMember/GovernanceMember';
import GovernanceProposalCard from './GovernanceProposal/GovernanceProposalCard';
import GovernanceTresury from './GovernanceTreasury/GovernanceTreasury';
import GovernanceUserProfile from './GovernanceUserProfile/GovernanceUserProfile';

import './GovernanceCards.scss';

const GovernanceCards = () => {
  return (
    <div className="GovernanceCards">
      <GovernanceMember />
      <GovernanceTresury />
      <GovernanceProposalCard />
      <GovernanceUserProfile />
    </div>
  );
};

export default GovernanceCards;
