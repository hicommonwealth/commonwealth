import React from 'react';
import { CWText } from '../../component_kit/cw_text';
import { CompletedProposalVotingResultProps } from '../votingResults/CompletedProposalVotingResult';

export const CompletedProposalVotingResultCard = ({
  abstainPct,
  noPct,
  noWithVetoPct,
  yesPct,
  yesResults,
}: CompletedProposalVotingResultProps) => {
  return (
    <div className="ResultSectionCard">
      <div className="results-header">
        <CWText type="b1" fontWeight="bold">
          Results
        </CWText>
        <CWText type="caption">{yesResults}</CWText>
      </div>

      <div className="results-header">
        <CWText>Yes</CWText>
        <CWText type="caption">{`${yesPct}%`}</CWText>
      </div>

      <div className="results-header">
        <CWText>No</CWText>
        <CWText type="caption">{`${noPct}%`}</CWText>
      </div>

      <div className="results-header">
        <CWText>{'Abstain'}</CWText>
        <CWText type="caption">{`${abstainPct}%`}</CWText>
      </div>

      <div className="results-header">
        <CWText>{'Veto'}</CWText>
        <CWText type="caption">{`${noWithVetoPct}%`}</CWText>
      </div>
    </div>
  );
};
