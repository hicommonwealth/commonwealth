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
import { SnapshotInformationCard } from './snapshot_information_card';
import { SnapshotVoteActionCard } from './snapshot_vote_action_card';
import { SnapshotVotingResultsCard } from './snapshot_voting_results_card';

type SnapshotProposalCardsAttrs = {
  identifier: string;
  proposal: SnapshotProposal;
  scores: number[];
  space: SnapshotSpace;
  symbol: string;
  threads: Array<{ id: string; title: string }> | null;
  totals: any;
  votes: SnapshotProposalVote[];
};

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
    } = vnode.attrs;

    const isActive =
      proposal &&
      moment(+proposal.start * 1000) <= moment() &&
      moment(+proposal.end * 1000) > moment();

    return (
      <div class="SnapshotProposalCards">
        <SnapshotInformationCard proposal={proposal} threads={threads} />
        {isActive && author && (
          <SnapshotVoteActionCard
            space={space}
            proposal={proposal}
            id={identifier}
            scores={scores}
            choices={proposal.choices}
            votes={votes}
          />
        )}
        <SnapshotVotingResultsCard
          choices={proposal.choices}
          votes={votes}
          totals={totals}
          symbol={symbol}
        />
      </div>
    );
  }
}
