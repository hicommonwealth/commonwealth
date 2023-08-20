import React from 'react';
import NearSputnikProposal from '../../../controllers/chain/near/sputnik/proposal';
import { YesNoRejectVotingResult } from './voting_result_components';

export function YesNoRejectResult({ votes, proposal }) {
  return (
    <YesNoRejectVotingResult
      proposal={proposal as NearSputnikProposal}
      votes={votes}
    />
  );
}
