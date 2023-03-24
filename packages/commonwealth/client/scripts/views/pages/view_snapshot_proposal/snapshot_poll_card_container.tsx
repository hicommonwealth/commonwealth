import React from 'react';

import { redraw } from 'mithrilInterop';
import type {
  SnapshotProposal,
  SnapshotProposalVote,
  SnapshotSpace,
} from 'helpers/snapshot_utils';
import moment from 'moment';

import app from 'state';
import { ConfirmSnapshotVoteModal } from '../../modals/confirm_snapshot_vote_modal';
import { SnapshotPollCard } from './snapshot_poll_card';
import { Modal } from '../../components/component_kit/cw_modal';

type SnapshotProposalCardsProps = {
  identifier: string;
  proposal: SnapshotProposal;
  scores: number[];
  space: SnapshotSpace;
  symbol: string;
  totals: any;
  votes: SnapshotProposalVote[];
  validatedAgainstStrategies: boolean;
  fetchedPower: boolean;
  totalScore: number;
};

const enum VotingError {
  NOT_VALIDATED = 'You cannot vote on this poll or are not logged in.',
  ALREADY_VOTED = 'Already Submitted Vote',
}

function calculateTimeRemaining(proposal: SnapshotProposal) {
  const now = moment();
  const endTime = moment(proposal.end * 1000);
  const duration = moment.duration(endTime.diff(now));
  const days = duration.days();
  const hours = duration.hours();
  const timeRemainingString = `${days} ${days > 1 ? 'days' : 'day'} ${hours}${
    hours > 1 ? 'hrs' : 'hr'
  } remaining`;
  return timeRemainingString;
}

export const SnapshotPollCardContainer = (
  props: SnapshotProposalCardsProps
) => {
  const {
    identifier,
    proposal,
    scores,
    space,
    totals,
    votes,
    validatedAgainstStrategies,
    fetchedPower,
    totalScore,
  } = props;

  const [isModalOpen, setIsModalOpen] = React.useState<boolean>(false);
  const [choice, setChoice] = React.useState<string>();
  const [callback, setCallback] = React.useState<() => any>();

  const isActive =
    proposal &&
    moment(+proposal.start * 1000) <= moment() &&
    moment(+proposal.end * 1000) > moment();

  const userVote =
    proposal.choices[
      votes.find((vote) => {
        return vote.voter === app.user?.activeAccount?.address;
      })?.choice - 1
    ];
  const hasVoted = userVote !== undefined;

  const voteErrorText = !validatedAgainstStrategies
    ? VotingError.NOT_VALIDATED
    : hasVoted
    ? VotingError.ALREADY_VOTED
    : null;

  const buildVoteInformation = (
    choices,
    snapshotVotes: SnapshotProposalVote[]
  ) => {
    const voteInfo = [];

    for (let i = 0; i < choices.length; i++) {
      const totalVotes = snapshotVotes
        .filter((vote) => vote.choice === i + 1)
        .reduce((sum, vote) => sum + vote.balance, 0);
      voteInfo.push({
        label: choices[i],
        value: choices[i],
        voteCount: totalVotes,
      });
    }

    return voteInfo;
  };

  return (
    <React.Fragment>
      <SnapshotPollCard
        pollEnded={!isActive}
        hasVoted={hasVoted}
        votedFor={hasVoted ? userVote : ''}
        disableVoteButton={!fetchedPower || voteErrorText !== null}
        proposalTitle={proposal.title}
        timeRemaining={calculateTimeRemaining(proposal)}
        tokenSymbol={space.symbol}
        totalVoteCount={totals.sumOfResultsBalance}
        voteInformation={buildVoteInformation(proposal?.choices, votes)}
        onSnapshotVoteCast={(_choice, _callback) => {
          setChoice(_choice);
          setCallback(_callback);

          if (choice && callback) {
            setIsModalOpen(true);
          }

          redraw();
        }}
        onVoteCast={() => {
          setIsModalOpen(false);
        }}
        incrementalVoteCast={totalScore}
        tooltipErrorMessage={voteErrorText}
        isPreview={false}
      />
      <Modal
        content={
          <ConfirmSnapshotVoteModal
            space={space}
            proposal={proposal}
            id={identifier}
            selectedChoice={proposal?.choices.indexOf(choice).toString()}
            totalScore={totalScore}
            scores={scores}
            snapshot={proposal.snapshot}
            successCallback={callback}
            onModalClose={() => setIsModalOpen(false)}
          />
        }
        onClose={() => setIsModalOpen(false)}
        open={isModalOpen}
      />
    </React.Fragment>
  );
};
