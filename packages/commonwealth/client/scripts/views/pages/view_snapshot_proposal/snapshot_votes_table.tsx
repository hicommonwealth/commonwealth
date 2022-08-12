/* @jsx m */

import m from 'mithril';

import 'pages/snapshot/snapshot_votes_table.scss';

import app from 'state';
import { SnapshotProposalVote } from 'helpers/snapshot_utils';
import { AddressInfo } from 'models';
import { formatNumberLong } from 'helpers';
import User from '../../components/widgets/user';
import { CWText } from '../../components/component_kit/cw_text';

type SnapshotVotesTableAttrs = {
  choices: Array<string>;
  toggleExpandedVoterList: () => void;
  symbol: string;
  voteCount: number;
  votersList: Array<SnapshotProposalVote>;
};

export class SnapshotVotesTable
  implements m.ClassComponent<SnapshotVotesTableAttrs>
{
  view(vnode) {
    const { choices, toggleExpandedVoterList, symbol, voteCount, votersList } =
      vnode.attrs;

    return (
      <div class="SnapshotVotesTable">
        <div class="votes-header-row">
          <CWText type="h4" fontWeight="semiBold">
            Votes
          </CWText>
          <div class="vote-count">
            <CWText className="vote-count-text" fontWeight="medium">
              {voteCount}
            </CWText>
          </div>
        </div>
        <div class="votes-container">
          <div class="column-header-row">
            <CWText type="h5" className="column-header-text">
              User
            </CWText>
            <CWText type="h5" className="column-header-text">
              Vote
            </CWText>
            <CWText type="h5" className="column-header-text">
              Power
            </CWText>
          </div>
          {votersList.map((vote) => (
            <div class="vote-row">
              {m(User, {
                user: new AddressInfo(
                  null,
                  vote.voter,
                  app.activeChainId(),
                  null
                ),
                linkify: true,
                popover: true,
              })}
              <CWText className="column-text" noWrap>
                {choices[vote.choice - 1]}
              </CWText>
              <CWText className="column-text" noWrap>
                {formatNumberLong(vote.balance)} {symbol}
              </CWText>
            </div>
          ))}
          <div
            class="view-more-footer"
            onclick={() => toggleExpandedVoterList()}
          >
            <CWText className="view-more-text" fontWeight="medium">
              View More
            </CWText>
          </div>
        </div>
      </div>
    );
  }
}
