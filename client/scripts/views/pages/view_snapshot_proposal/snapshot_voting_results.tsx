/* @jsx m */

import m from 'mithril';

import 'pages/snapshot/snapshot_voting_results.scss';

import { SnapshotProposalVote } from 'helpers/snapshot_utils';
import { formatPercent, formatNumberLong } from 'helpers';
import { CWCard } from '../../components/component_kit/cw_card';
import { CWText } from '../../components/component_kit/cw_text';

type VotingResultsAttrs = {
  choices: string[];
  symbol: string;
  totals: any;
  votes: SnapshotProposalVote[];
};

export class SnapshotVotingResults
  implements m.ClassComponent<VotingResultsAttrs>
{
  private voteListings: any[];

  view(vnode) {
    const { choices, totals, symbol } = vnode.attrs;

    if (!choices.length) return;

    this.voteListings = choices.map((choice, idx) => {
      const totalForChoice = totals.resultsByVoteBalance[idx];

      const voteFrac =
        totals.sumOfResultsBalance !== 0
          ? totalForChoice / totals.sumOfResultsBalance
          : 0;

      return (
        <div class="result-container">
          <div class="result-choice">{choice}</div>
          <div class="result-choice-details">
            <div class="vote-balance-for-choice">
              <span class="font-medium">
                {formatNumberLong(totalForChoice)}
              </span>
              <span class="symbol">{symbol}</span>
            </div>
            <span class="font-medium">{formatPercent(voteFrac, 2)}</span>
          </div>
          <div class="result-progress" max="100" value={voteFrac * 100} />
        </div>
      );
    });

    return (
      <CWCard elevation="elevation-1" className="SnapshotVotingResults">
        <CWText type="h3" fontWeight="semiBold">
          Current Results
        </CWText>
        {[this.voteListings]}
      </CWCard>
    );
  }
}
