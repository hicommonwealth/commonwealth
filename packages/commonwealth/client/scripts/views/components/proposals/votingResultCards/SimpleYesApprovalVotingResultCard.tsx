import clsx from 'clsx';
import React from 'react';
import { CWText } from '../../component_kit/cw_text';
import { SimpleYesApprovalVotingResultProps } from '../votingResults/SimpleYesApprovalVotingResult';

export const SimpleYesApprovalVotingResultCard = (
  props: SimpleYesApprovalVotingResultProps
) => {
  const { approvedCount } = props;

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
