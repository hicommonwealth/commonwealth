import clsx from 'clsx';
import React from 'react';
import { CWText } from '../component_kit/cw_text';
import { CompletedProposalVotingResultProps } from './voting_result_components';

export const CompletedProposalVotingResultCard = (
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
  } = props;

  return (
    <div className={clsx('ResultsSection', 'TopBorder')}>
      <div className="results-header">
        <CWText type="b1" fontWeight="bold">
          {'Results'}
        </CWText>
        <CWText type="caption">{`${yesResults}`}</CWText>
      </div>

      <div className="results-header">
        <CWText type="d5">{'Yes'}</CWText>
        <CWText type="caption">{`${yesPct}%`}</CWText>
      </div>

      <div className="results-header">
        <CWText type="d5">{'No'}</CWText>
        <CWText type="caption">{`${noPct}%`}</CWText>
      </div>

      <div className="results-header">
        <CWText type="d5">{'Abstain'}</CWText>
        <CWText type="caption">{`${abstainPct}%`}</CWText>
      </div>

      <div className="results-header">
        <CWText type="d5">{'Veto'}</CWText>
        <CWText type="caption">{`${noWithVetoPct}%`}</CWText>
      </div>
    </div>
  );
};
