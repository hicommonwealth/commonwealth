import React from 'react';
import { IVote } from '../../../../models/interfaces';
import { AnyProposal } from '../../../../models/types';
import { CWText } from '../../component_kit/cw_text';
import { VoteListing } from '../vote_listing';
import { VotingResultCard } from '../votingResultCards/VotingResultCard';

export type VotingResultProps = {
  abstainVotes?: Array<IVote<any>>;
  noVotes: Array<IVote<any>>;
  yesVotes: Array<IVote<any>>;
  proposal: AnyProposal;
  isInCard?: boolean;
};

export const VotingResult = (props: VotingResultProps) => {
  const { abstainVotes, noVotes, yesVotes, proposal, isInCard } = props;

  if (isInCard) {
    return <VotingResultCard {...props} />;
  }

  return (
    <div className="VotingResult">
      <div className="results-column-yes">
        <CWText type="h4" fontWeight="medium" className="results-header">
          {`Yes (${yesVotes.length})`}
        </CWText>
        <VoteListing proposal={proposal} votes={yesVotes} />
      </div>
      <div className="results-column-no">
        <CWText type="h4" fontWeight="medium" className="results-header">
          {`No (${noVotes.length})`}
        </CWText>
        <VoteListing proposal={proposal} votes={noVotes} />
      </div>
      {abstainVotes && (
        <div className="results-column-no">
          <CWText type="h4" fontWeight="medium" className="results-header">
            {`Abstain (${abstainVotes.length})`}
          </CWText>
          <VoteListing proposal={proposal} votes={abstainVotes} />
        </div>
      )}
    </div>
  );
};
