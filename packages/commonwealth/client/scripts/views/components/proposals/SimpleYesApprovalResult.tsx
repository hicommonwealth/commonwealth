import React from 'react';
import { CosmosProposal } from '../../../controllers/chain/cosmos/gov/v1beta1/proposal-v1beta1';
import { SimpleYesApprovalVotingResult } from './voting_result_components';

export function SimpleYesApprovalResult({ votes, proposal }) {
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
}
