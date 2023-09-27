import React from 'react';
import { CWText } from '../../component_kit/cw_text';
import { VoteListing } from '../vote_listing';
import { SimpleYesApprovalVotingResultCard } from '../votingResultCards/SimpleYesApprovalVotingResultCard';
import { BaseVotingResultProps } from './BaseVotingResultTypes';

export type SimpleYesApprovalVotingResultProps = {
  approvedCount: number;
  isInCard?: boolean;
} & BaseVotingResultProps;

export const SimpleYesApprovalVotingResult = (
  props: SimpleYesApprovalVotingResultProps
) => {
  const { approvedCount, proposal, votes, isInCard } = props;

  if (isInCard) {
    return <SimpleYesApprovalVotingResultCard {...props} />;
  }

  return (
    <div className="VotingResult">
      <div className="results-column">
        <CWText type="h4" fontWeight="medium" className="results-header">
          {`Approved ${approvedCount}`}
        </CWText>
        <VoteListing proposal={proposal} votes={votes} />
      </div>
    </div>
  );
};
