import clsx from 'clsx';
import React from 'react';
import { formatPercent } from '../../../../helpers/index';
import { CWText } from '../../component_kit/cw_text';
import { YesNoAbstainVetoVotingResultProps } from '../votingResults/YesNoAbstainVetoVotingResult';
import { safeDivision } from './AaveVotingResultCard';

export const YesNoAbstainVetoVotingResultCard = (
  props: YesNoAbstainVetoVotingResultProps
) => {
  const { votes } = props;

  const yesVotes = votes.filter((v) => v.choice === 'Yes').length;
  const noVotes = votes.filter((v) => v.choice === 'No').length;
  const abstainVotes = votes.filter((v) => v.choice === 'Abstain').length;
  const vetoVotes = votes.filter((v) => v.choice === 'NoWithVeto').length;
  const totalVotes = votes.length;

  return (
    <div className={clsx('ResultsSection', 'TopBorder')}>
      <div className="results-header">
        <CWText type="b1" fontWeight="bold">
          Results
        </CWText>
        <CWText type="caption">{`${votes.length} total votes`}</CWText>
      </div>

      <div className="results-header">
        <CWText>Yes</CWText>
        <CWText type="caption">{`${formatPercent(
          safeDivision(yesVotes, totalVotes)
        )}`}</CWText>
      </div>

      <div className="results-header">
        <CWText>No</CWText>
        <CWText type="caption">{`${formatPercent(
          safeDivision(noVotes, totalVotes)
        )}`}</CWText>
      </div>

      <div className="results-header">
        <CWText>{'Abstain'}</CWText>
        <CWText type="caption">{`${formatPercent(
          safeDivision(abstainVotes, totalVotes)
        )}`}</CWText>
      </div>

      <div className="results-header">
        <CWText>{'Veto'}</CWText>
        <CWText type="caption">{`${formatPercent(
          safeDivision(vetoVotes, totalVotes)
        )}`}</CWText>
      </div>
    </div>
  );
};
