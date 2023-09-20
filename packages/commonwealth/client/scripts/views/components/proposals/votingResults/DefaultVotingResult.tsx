import React from 'react';
import { VotingResult } from '../voting_result_components';

export function DefaultVotingResult({ votes, proposal, isInCard }) {
  return (
    <VotingResult
      yesVotes={votes.filter((v) => v.choice === true)}
      noVotes={votes.filter((v) => v.choice === false)}
      proposal={proposal}
      isInCard={isInCard}
    />
  );
}
