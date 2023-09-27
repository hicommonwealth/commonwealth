import React from 'react';
import NearSputnikProposal from '../../../../controllers/chain/near/sputnik/proposal';
import { NearSputnikVote } from '../../../../controllers/chain/near/sputnik/types';
import { AnyProposal } from '../../../../models/types';
import { YesNoRejectVotingResult } from './YesNoRejectVotingResult';

interface YesNoRejectResultProps {
  proposal: AnyProposal;
  votes: NearSputnikVote[];
}

export const YesNoRejectResult = ({
  votes,
  proposal,
}: YesNoRejectResultProps) => {
  return (
    <YesNoRejectVotingResult
      proposal={proposal as NearSputnikProposal}
      votes={votes}
    />
  );
};
