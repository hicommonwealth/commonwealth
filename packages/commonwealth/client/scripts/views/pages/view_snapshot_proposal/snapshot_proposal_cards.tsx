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
import { PollCard, PollType } from '../../components/component_kit/polls';
import { ConfirmSnapshotVoteModal } from '../../modals/confirm_snapshot_vote_modal';

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
  NOT_VALIDATED = 'Insufficient Voting Power',
  ALREADY_VOTED = 'Already Submitted Vote',
}

export class SnapshotProposalCards
  implements m.ClassComponent<SnapshotProposalCardsAttrs>
{
  view(vnode) {
    const author = app.user.activeAccount;

    const {
      identifier,
      proposal,
      scores,
      space,
      symbol,
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

    const userVote = votes.find((vote) => {
      return vote.voter === app.user?.activeAccount?.address;
    })?.choice;
    console.log('userVote', userVote);
    const hasVoted = userVote !== undefined;

    const voteErrorText = !validatedAgainstStrategies
      ? VotingError.NOT_VALIDATED
      : hasVoted
      ? VotingError.ALREADY_VOTED
      : '';

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
      const choiceNumber =
        vnode.state.proposal?.choices.indexOf(selectedChoice);
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

        <PollCard
          pollType={PollType.Snapshot}
          multiSelect={false}
          pollEnded={!isActive}
          hasVoted
          votedFor={hasVoted ? userVote : ''}
          disableVoteButton={fetchedPower && voteErrorText !== ''}
          proposalTitle={proposal.title}
          timeRemainingString={voteErrorText}
          totalVoteCount={totals.sumOfResultsBalance}
          voteInformation={buildVoteInformation(proposal?.choices, votes)}
          onVoteCast={(choice: string, callback: () => any) => {
            castSnapshotVote(choice, callback);
            m.redraw();
          }}
        />
      </div>
    );
  }
}
