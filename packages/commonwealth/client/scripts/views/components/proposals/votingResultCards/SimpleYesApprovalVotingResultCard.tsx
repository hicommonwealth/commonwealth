import React from 'react';
import { CWText } from '../../component_kit/cw_text';
import { SimpleYesApprovalVotingResultProps } from '../votingResults/SimpleYesApprovalVotingResult';

export const SimpleYesApprovalVotingResultCard = ({
  approvedCount,
}: SimpleYesApprovalVotingResultProps) => {
  return (
    <div className="ResultSectionCard">
      <div className="results-header">
        <CWText type="b1" fontWeight="bold">
          Results
        </CWText>
        <CWText type="caption">{`${approvedCount} approved`}</CWText>
      </div>
    </div>
  );
};
