import React from 'react';
import { BaseVotingResultCardProps } from './BaseVotingResultTypes';
import { VotingResult } from './VotingResult';

export const DefaultVotingResult = ({
  votes,
  proposal,
  isInCard,
}: BaseVotingResultCardProps) => {
  return (
    <VotingResult
      yesVotes={votes.filter((v) => v.choice === true)}
      noVotes={votes.filter((v) => v.choice === false)}
      proposal={proposal}
      isInCard={isInCard}
    />
  );
};
