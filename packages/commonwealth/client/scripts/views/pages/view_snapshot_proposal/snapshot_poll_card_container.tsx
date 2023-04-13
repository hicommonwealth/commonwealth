import React, { useMemo } from 'react';

import type {
  SnapshotProposal,
  SnapshotProposalVote,
  SnapshotSpace,
} from 'helpers/snapshot_utils';
import moment from 'moment';

import { ConfirmSnapshotVoteModal } from '../../modals/confirm_snapshot_vote_modal';
import { SnapshotPollCard } from './snapshot_poll_card';
import { Modal } from '../../components/component_kit/cw_modal';

type SnapshotProposalCardsProps = {
  activeUserAddress: string;
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
    activeUserAddress,
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
        return vote.voter === activeUserAddress;
      })?.choice - 1
    ];
  const hasVoted = userVote !== undefined;

  const voteErrorText = !validatedAgainstStrategies
    ? VotingError.NOT_VALIDATED
    : hasVoted
    ? VotingError.ALREADY_VOTED
    : null;

  const timeRemaining = useMemo(() => {
    return calculateTimeRemaining(proposal);
  }, [proposal]);

  const voteInformation = useMemo(() => {
    if (!proposal) {
      return [];
    }
    const { choices } = proposal;
    const voteInfo = [];
    for (let i = 0; i < choices.length; i++) {
      const totalVotes = votes
        .filter((vote) => vote.choice === i + 1)
        .reduce((sum, vote) => sum + vote.balance, 0);
      voteInfo.push({
        label: choices[i],
        value: choices[i],
        voteCount: totalVotes,
      });
    }
    return voteInfo;
  }, [proposal, votes]);

  return (
    <>
      <SnapshotPollCard
        pollEnded={!isActive}
        hasVoted={hasVoted}
        votedFor={hasVoted ? userVote : ''}
        disableVoteButton={!fetchedPower || voteErrorText !== null}
        proposalTitle={proposal.title}
        timeRemaining={timeRemaining}
        tokenSymbol={space.symbol}
        totalVoteCount={totals.sumOfResultsBalance}
        voteInformation={voteInformation}
        onSnapshotVoteCast={(_choice, _callback) => {
          setChoice(_choice);
          setCallback(_callback);
          if (choice && callback) {
            setIsModalOpen(true);
          }
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
    </>
  );
};
