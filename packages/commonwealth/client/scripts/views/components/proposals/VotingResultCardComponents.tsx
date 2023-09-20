import clsx from 'clsx';
import React from 'react';
import { NearSputnikVoteString } from '../../../controllers/chain/near/sputnik/types';
import { formatPercent } from '../../../helpers/index';
import { CWText } from '../component_kit/cw_text';
import { roundVote } from './aave_proposal_card_detail';
import { VoteListing } from './vote_listing';
import {
  AaveVotingResultProps,
  CompletedProposalVotingResultProps,
  SimpleYesApprovalVotingResultProps,
  VotingResultProps,
  YesNoAbstainVetoVotingResultProps,
  YesNoRejectVotingResultProps,
} from './voting_result_components';

function safeDivision(num, den) {
  if (den === 0) {
    return 0;
  }

  return num / den;
}

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
        <CWText type="d2">{'Yes'}</CWText>
        <CWText type="caption">{`${yesPct}%`}</CWText>
      </div>

      <div className="results-header">
        <CWText type="d2">{'No'}</CWText>
        <CWText type="caption">{`${noPct}%`}</CWText>
      </div>

      <div className="results-header">
        <CWText type="d2">{'Abstain'}</CWText>
        <CWText type="caption">{`${abstainPct}%`}</CWText>
      </div>

      <div className="results-header">
        <CWText type="d2">{'Veto'}</CWText>
        <CWText type="caption">{`${noWithVetoPct}%`}</CWText>
      </div>
    </div>
  );
};

export const AaveVotingResultCard = (props: AaveVotingResultProps) => {
  const {
    noBalanceString,
    noVotesCount,
    proposal,
    votes,
    yesBalanceString,
    yesVotesCount,
  } = props;

  const totalVotesCount = yesVotesCount + noVotesCount;

  return (
    <div className={clsx('ResultsSection', 'TopBorder')}>
      <div className="results-header">
        <CWText type="b1" fontWeight="bold">
          {'Results'}
        </CWText>
        <CWText type="caption">{`${formatPercent(
          proposal.turnout
        )} of token holders`}</CWText>
      </div>

      <div className="results-header">
        <CWText type="d2">{'Yes'}</CWText>
        <CWText type="caption">{`${formatPercent(
          safeDivision(yesVotesCount, totalVotesCount)
        )}`}</CWText>
      </div>

      <div className="results-header">
        <CWText type="d2">{'No'}</CWText>
        <CWText type="caption">{`${formatPercent(
          safeDivision(noVotesCount, totalVotesCount)
        )}`}</CWText>
      </div>
    </div>
  );
};

export const VotingResultCard = (props: VotingResultProps) => {
  const { abstainVotes, noVotes, yesVotes, proposal } = props;

  return (
    <div className={clsx('ResultsSection', 'TopBorder')}>
      <div className="results-header">
        <CWText type="b1" fontWeight="bold">
          {'Results'}
        </CWText>
        <CWText type="caption">{`${
          yesVotes.length + noVotes.length
        } total votes`}</CWText>
      </div>

      <div className="results-header">
        <CWText type="d2">{'Yes'}</CWText>
        <CWText type="caption">{`${yesVotes.length} votes`}</CWText>
      </div>

      <div className="results-header">
        <CWText type="d2">{'No'}</CWText>
        <CWText type="caption">{`${noVotes.length} votes`}</CWText>
      </div>

      <div className="results-header">
        <CWText type="d2">{'Abstain'}</CWText>
        <CWText type="caption">{`${abstainVotes.length} votes`}</CWText>
      </div>
    </div>
  );
};

export const SimpleYesApprovalVotingResultCard = (
  props: SimpleYesApprovalVotingResultProps
) => {
  const { approvedCount, proposal, votes } = props;

  return (
    <div className={clsx('ResultsSection', 'TopBorder')}>
      <div className="results-header">
        <CWText type="b1" fontWeight="bold">
          {'Results'}
        </CWText>
        <CWText type="caption">{`${approvedCount} approved`}</CWText>
      </div>
    </div>
  );
};

export const YesNoAbstainVetoVotingResultCard = (
  props: YesNoAbstainVetoVotingResultProps
) => {
  const { proposal, votes, isInCard } = props;

  const yesVotes = votes.filter((v) => v.choice === 'Yes').length;
  const noVotes = votes.filter((v) => v.choice === 'No').length;
  const abstainVotes = votes.filter((v) => v.choice === 'Abstain').length;
  const vetoVotes = votes.filter((v) => v.choice === 'NoWithVeto').length;
  const totalVotes = votes.length;

  return (
    <div className={clsx('ResultsSection', 'TopBorder')}>
      <div className="results-header">
        <CWText type="b1" fontWeight="bold">
          {'Results'}
        </CWText>
        <CWText type="caption">{`${votes.length} total votes`}</CWText>
      </div>

      <div className="results-header">
        <CWText type="d2">{'Yes'}</CWText>
        <CWText type="caption">{`${formatPercent(
          safeDivision(yesVotes, totalVotes)
        )}`}</CWText>
      </div>

      <div className="results-header">
        <CWText type="d2">{'No'}</CWText>
        <CWText type="caption">{`${formatPercent(
          safeDivision(noVotes, totalVotes)
        )}`}</CWText>
      </div>

      <div className="results-header">
        <CWText type="d2">{'Abstain'}</CWText>
        <CWText type="caption">{`${formatPercent(
          safeDivision(abstainVotes, totalVotes)
        )}`}</CWText>
      </div>

      <div className="results-header">
        <CWText type="d2">{'Veto'}</CWText>
        <CWText type="caption">{`${formatPercent(
          safeDivision(vetoVotes, totalVotes)
        )}`}</CWText>
      </div>
    </div>
  );
};

export const YesNoRejectVotingResultCard = (
  props: YesNoRejectVotingResultProps
) => {
  const { proposal, votes } = props;

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
          {'Results'}
        </CWText>
        <CWText type="caption">{`${votes.length} total votes`}</CWText>
      </div>

      <div className="results-header">
        <CWText type="d2">{'Yes'}</CWText>
        <CWText type="caption">{`${approveVotes} approved (${formatPercent(
          safeDivision(approveVotes, totalVotes)
        )})`}</CWText>
      </div>

      <div className="results-header">
        <CWText type="d2">{'No'}</CWText>
        <CWText type="caption">{`${rejectVotes} rejected (${formatPercent(
          safeDivision(rejectVotes, totalVotes)
        )})`}</CWText>
      </div>

      <div className="results-header">
        <CWText type="d2">{'Abstain'}</CWText>
        <CWText type="caption">{`${removeVotes} remove ${formatPercent(
          safeDivision(removeVotes, totalVotes)
        )}`}</CWText>
      </div>
    </div>
  );
};
