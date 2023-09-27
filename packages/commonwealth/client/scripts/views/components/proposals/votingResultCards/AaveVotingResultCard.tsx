import clsx from 'clsx';
import React from 'react';
import { formatPercent } from '../../../../helpers/index';
import { CWText } from '../../component_kit/cw_text';
import { AaveVotingResultProps } from '../votingResults/AaveVotingResult';

export function safeDivision(num, den) {
  if (den === 0) {
    return 0;
  }

  return num / den;
}

export const AaveVotingResultCard = (props: AaveVotingResultProps) => {
  const { noVotesCount, proposal, yesVotesCount } = props;

  const totalVotesCount = yesVotesCount + noVotesCount;

  return (
    <div className="ResultSectionCard">
      <div className="results-header">
        <CWText type="b1" fontWeight="bold">
          Results
        </CWText>
        <CWText type="caption">{`${formatPercent(
          proposal.turnout
        )} of token holders`}</CWText>
      </div>

      <div className="results-header">
        <CWText>Yes</CWText>
        <CWText type="caption">{`${formatPercent(
          safeDivision(yesVotesCount, totalVotesCount)
        )}`}</CWText>
      </div>

      <div className="results-header">
        <CWText>No</CWText>
        <CWText type="caption">{`${formatPercent(
          safeDivision(noVotesCount, totalVotesCount)
        )}`}</CWText>
      </div>
    </div>
  );
};
