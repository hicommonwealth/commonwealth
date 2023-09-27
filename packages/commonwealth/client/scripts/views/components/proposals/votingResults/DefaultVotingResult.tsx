import React from 'react';
import { AnyProposal } from '../../../../models/types';
import { BinaryVote } from '../../../../models/votes';
import { VotingResult } from './VotingResult';

interface DefaultVotingResult {
  proposal: AnyProposal;
  votes: BinaryVote<any>[];
  isInCard?: boolean;
}

export const DefaultVotingResult = ({
  votes,
  proposal,
  isInCard,
}: DefaultVotingResult) => {
  return (
    <VotingResult
      yesVotes={votes.filter((v) => v.choice === true)}
      noVotes={votes.filter((v) => v.choice === false)}
      proposal={proposal}
      isInCard={isInCard}
    />
  );
};
