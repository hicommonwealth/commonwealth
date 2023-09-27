import React from 'react';
import { CosmosProposal } from '../../../../controllers/chain/cosmos/gov/v1beta1/proposal-v1beta1';
import { SimpleYesApprovalVotingResult } from './SimpleYesApprovalVotingResult';
import { BaseVotingResultProps } from './BaseVotingResultTypes';

export const SimpleYesApprovalResult = ({
  votes,
  proposal,
}: BaseVotingResultProps) => {
  if (proposal instanceof CosmosProposal) {
    return (
      <SimpleYesApprovalVotingResult
        approvedCount={proposal.depositorsAsVotes.length}
        proposal={proposal}
        votes={proposal.depositorsAsVotes}
      />
    );
  } else {
    return (
      <SimpleYesApprovalVotingResult
        approvedCount={votes.length}
        proposal={proposal}
        votes={votes}
      />
    );
  }
};
