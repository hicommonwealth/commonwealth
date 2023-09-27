import React from 'react';
import { CWText } from '../../component_kit/cw_text';
import { CompletedProposalVotingResultCard } from '../votingResultCards/CompletedProposalVotingResultCard';

export type CompletedProposalVotingResultProps = {
  abstainPct: string;
  abstainResults: string;
  noPct: string;
  noResults: string;
  noWithVetoPct: string;
  noWithVetoResults: string;
  yesPct: string;
  yesResults: string;
  isInCard: boolean;
};

export const CompletedProposalVotingResult = (
  props: CompletedProposalVotingResultProps
) => {
  const {
    abstainPct,
    abstainResults,
    noPct,
    noResults,
    noWithVetoPct,
    noWithVetoResults,
    yesPct,
    yesResults,
    isInCard,
  } = props;

  if (isInCard) {
    return <CompletedProposalVotingResultCard {...props} />;
  }

  return (
    <div className="VotingResult">
      <div className="results-column">
        <CWText type="h4" fontWeight="medium" className="results-header">
          {`${yesPct}% voted Yes`}
        </CWText>
        <CWText>{`(${yesResults})`}</CWText>
      </div>
      <div className="results-column">
        <CWText type="h4" fontWeight="medium" className="results-header">
          {`${noPct}% voted No`}
        </CWText>
        <CWText>{`(${noResults})`}</CWText>
      </div>
      <div className="results-column">
        <CWText type="h4" fontWeight="medium" className="results-header">
          {`${abstainPct}% voted Abstain`}
        </CWText>
        <CWText>{`(${abstainResults})`}</CWText>
      </div>
      <div className="results-column">
        <CWText type="h4" fontWeight="medium" className="results-header">
          {`${noWithVetoPct}% voted Veto`}
        </CWText>
        <CWText>{`(${noWithVetoResults})`}</CWText>
      </div>
    </div>
  );
};
