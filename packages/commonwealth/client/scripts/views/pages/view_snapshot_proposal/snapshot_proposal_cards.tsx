/* @jsx m */

import m from 'mithril';
import moment from 'moment';

import 'pages/snapshot/snapshot_proposal_cards.scss';

import app from 'state';
import {
  SnapshotProposal,
  SnapshotProposalVote,
  SnapshotSpace,
} from 'helpers/snapshot_utils';
import { notifyError } from 'controllers/app/notifications';
import { SnapshotInformationCard } from './snapshot_information_card';
import { ConfirmSnapshotVoteModal } from '../../modals/confirm_snapshot_vote_modal';
import { SnapshotPollCard } from './snapshot_poll_card';

type SnapshotProposalCardsAttrs = {
  identifier: string;
  proposal: SnapshotProposal;
  scores: number[];
  space: SnapshotSpace;
  symbol: string;
  threads: Array<{ id: string; title: string }> | null;
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

export class SnapshotProposalCards
  implements m.ClassComponent<SnapshotProposalCardsAttrs>
{
  view(vnode) {
    const {
      identifier,
      proposal,
      scores,
      space,
      threads,
      totals,
      votes,
      validatedAgainstStrategies,
      fetchedPower,
      totalScore,
    } = vnode.attrs;

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

    const castSnapshotVote = async (
      selectedChoice: string,
      callback: () => any
    ) => {
      const choiceNumber = proposal?.choices.indexOf(selectedChoice);
      try {
        app.modals.create({
          modal: ConfirmSnapshotVoteModal,
          data: {
            space,
            proposal,
            id: identifier,
            selectedChoice: choiceNumber,
            totalScore,
            scores,
            snapshot: proposal.snapshot,
            successCallback: callback,
          },
        });
        // vnode.state.votingModalOpen = true;
      } catch (err) {
        console.error(err);
        notifyError('Voting failed');
      }
    };

    return (
      <div class="SnapshotProposalCards">
        <SnapshotInformationCard proposal={proposal} threads={threads} />
        <SnapshotPollCard
          pollEnded={!isActive}
          hasVoted={hasVoted}
          votedFor={hasVoted ? userVote : ''}
          disableVoteButton={fetchedPower && voteErrorText !== null}
          proposalTitle={proposal.title}
          timeRemaining={calculateTimeRemaining(proposal)}
          tokenSymbol={space.symbol}
          totalVoteCount={totals.sumOfResultsBalance}
          voteInformation={buildVoteInformation(proposal?.choices, votes)}
          onVoteCast={(choice: string, callback: () => any) => {
            castSnapshotVote(choice, callback);
            m.redraw();
          }}
          incrementalVoteCast={totalScore}
          tooltipErrorMessage={voteErrorText}
        />
      </div>
    );
  }
}
