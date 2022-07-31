/* @jsx m */

import m from 'mithril';
import { RadioGroup } from 'construct-ui';

import 'pages/snapshot/snapshot_vote_action_card.scss';

import app from 'state';
import { ConfirmSnapshotVoteModal } from 'views/modals/confirm_snapshot_vote_modal';
import {
  SnapshotSpace,
  SnapshotProposal,
  SnapshotProposalVote,
  getPower,
} from 'helpers/snapshot_utils';
import { notifyError } from 'controllers/app/notifications';
import { CWButton } from '../../components/component_kit/cw_button';
import { CWText } from '../../components/component_kit/cw_text';
import { CWCard } from '../../components/component_kit/cw_card';

const enum VotingError {
  NOT_VALIDATED = 'Insufficient Voting Power',
  ALREADY_VOTED = 'Already Submitted Vote',
}

type SnapshotVoteActionCardAttrs = {
  choices: string[];
  id: string;
  proposal: SnapshotProposal;
  scores: number[];
  space: SnapshotSpace;
  votes: SnapshotProposalVote[];
};

export class SnapshotVoteActionCard
  implements m.ClassComponent<SnapshotVoteActionCardAttrs>
{
  private chosenOption: string;
  private fetchedPower: boolean;
  private totalScore: number;
  private validatedAgainstStrategies: boolean;
  private votingModalOpen: boolean;

  oninit() {
    this.fetchedPower = false;
    this.validatedAgainstStrategies = true;
  }

  view(vnode) {
    const { proposal } = vnode.attrs;

    const hasVoted = vnode.attrs.votes.find((vote) => {
      return vote.voter === app.user?.activeAccount?.address;
    })?.choice;

    if (!this.fetchedPower) {
      getPower(
        vnode.attrs.space,
        vnode.attrs.proposal,
        app.user?.activeAccount?.address
      ).then((vals) => {
        this.validatedAgainstStrategies = vals.totalScore > 0;
        this.totalScore = vals.totalScore;
        m.redraw();
      });
      this.fetchedPower = true;
    }

    const vote = async (selectedChoice: number) => {
      try {
        app.modals.create({
          modal: ConfirmSnapshotVoteModal,
          data: {
            space: vnode.attrs.space,
            proposal: vnode.attrs.proposal,
            id: vnode.attrs.id,
            selectedChoice,
            totalScore: this.totalScore,
          },
        });
        this.votingModalOpen = true;
      } catch (err) {
        console.error(err);
        notifyError('Voting failed');
      }
    };

    if (!vnode.attrs.proposal.choices?.length) return;

    const voteText = !this.validatedAgainstStrategies
      ? VotingError.NOT_VALIDATED
      : hasVoted
      ? VotingError.ALREADY_VOTED
      : '';

    return (
      <CWCard elevation="elevation-1" className="SnapshotVoteActionCard">
        <CWText type="h3" fontWeight="semiBold">
          Cast your vote
        </CWText>
        <RadioGroup
          class="vote-action-radio-group"
          options={proposal.choices}
          value={(hasVoted && proposal.choices[hasVoted]) || this.chosenOption}
          onchange={(e: Event) => {
            this.chosenOption = (e.currentTarget as HTMLInputElement).value;
          }}
        />
        <div class="vote-button-and-vote-text-row">
          <CWButton
            label="Vote"
            disabled={
              !this.fetchedPower ||
              hasVoted !== undefined ||
              !this.chosenOption ||
              !this.validatedAgainstStrategies
            }
            onclick={() => {
              vote(proposal.choices.indexOf(this.chosenOption));
              m.redraw();
            }}
          />
          <CWText className="vote-text" title={voteText} noWrap>
            {voteText}
          </CWText>
        </div>
      </CWCard>
    );
  }
}
