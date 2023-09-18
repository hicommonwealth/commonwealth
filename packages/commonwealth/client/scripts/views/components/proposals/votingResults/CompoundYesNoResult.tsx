import React from 'react';
import { BravoVote } from '../../../../controllers/chain/ethereum/compound/proposal';
import { VotingResult } from '../voting_result_components';

export function CompoundYesNoResult({ votes, proposal }) {
  return (
    <VotingResult
      abstainVotes={votes.filter((v) => v.choice === BravoVote.ABSTAIN)}
      yesVotes={votes.filter((v) => v.choice === BravoVote.YES)}
      noVotes={votes.filter((v) => v.choice === BravoVote.NO)}
      proposal={proposal}
    />
  );
}
