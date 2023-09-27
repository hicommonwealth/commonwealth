import clsx from 'clsx';
import React from 'react';
import { NearSputnikVoteString } from '../../../../controllers/chain/near/sputnik/types';
import { formatPercent } from '../../../../helpers/index';
import { CWText } from '../../component_kit/cw_text';
import { YesNoRejectVotingResultProps } from '../votingResults/YesNoRejectVotingResult';
import { safeDivision } from './AaveVotingResultCard';

export const YesNoRejectVotingResultCard = (
  props: YesNoRejectVotingResultProps
) => {
  const { votes } = props;

  const approveVotes = votes.filter(
    (v) => v.choice === NearSputnikVoteString.Approve
  ).length;
  const rejectVotes = votes.filter(
    (v) => v.choice === NearSputnikVoteString.Reject
  ).length;
  const removeVotes = votes.filter(
    (v) => v.choice === NearSputnikVoteString.Remove
  ).length;
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
        <CWText type="caption">{`${approveVotes} approved (${formatPercent(
          safeDivision(approveVotes, totalVotes)
        )})`}</CWText>
      </div>

      <div className="results-header">
        <CWText>No</CWText>
        <CWText type="caption">{`${rejectVotes} rejected (${formatPercent(
          safeDivision(rejectVotes, totalVotes)
        )})`}</CWText>
      </div>

      <div className="results-header">
        <CWText>{'Abstain'}</CWText>
        <CWText type="caption">{`${removeVotes} remove ${formatPercent(
          safeDivision(removeVotes, totalVotes)
        )}`}</CWText>
      </div>
    </div>
  );
};
