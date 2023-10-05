import React from 'react';
import { CWText } from '../../component_kit/cw_text';
import { VotingResultProps } from '../votingResults/VotingResult';

export const VotingResultCard = ({
  abstainVotes,
  noVotes,
  yesVotes,
}: VotingResultProps) => {
  return (
    <div className="ResultSectionCard">
      <div className="results-header">
        <CWText type="b1" fontWeight="bold">
          Results
        </CWText>
        <CWText type="caption">
          {yesVotes.length + noVotes.length} total votes
        </CWText>
      </div>

      <div className="results-header">
        <CWText>Yes</CWText>
        <CWText type="caption">{yesVotes.length} votes</CWText>
      </div>

      <div className="results-header">
        <CWText>No</CWText>
        <CWText type="caption">{noVotes.length} votes</CWText>
      </div>

      <div className="results-header">
        <CWText>Abstain</CWText>
        <CWText type="caption">{abstainVotes.length} votes</CWText>
      </div>
    </div>
  );
};
