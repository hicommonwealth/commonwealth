/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';

import 'pages/snapshot/snapshot_votes_table.scss';

import app from 'state';
import { AddressInfo } from 'models';
import { formatNumberLong } from 'helpers';
import { User } from '../../components/user/user';
import { CWText } from '../../components/component_kit/cw_text';

type SnapshotVoteType = {
  balance: number;
  choice: number;
  created: number;
  id: string;
  scores?: Array<number>;
  voter: string;
};

type SnapshotVotesTableAttrs = {
  choices: Array<string>;
  symbol: string;
  voters: Array<SnapshotVoteType>;
};

export class SnapshotVotesTable extends ClassComponent<SnapshotVotesTableAttrs> {
  isVotersListExpanded: boolean;

  view(vnode: m.Vnode<SnapshotVotesTableAttrs>) {
    const { choices, symbol, voters } = vnode.attrs;

    const toggleExpandedVoterList = () => {
      this.isVotersListExpanded = !this.isVotersListExpanded;
      m.redraw();
    };

    const displayedVoters = this.isVotersListExpanded
      ? voters
      : voters.slice(0, 10);

    return (
      <div class="SnapshotVotesTable">
        <div class="votes-header-row">
          <CWText type="h4" fontWeight="semiBold">
            Votes
          </CWText>
          <div class="vote-count">
            <CWText className="vote-count-text" fontWeight="medium">
              {voters.length}
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
          {displayedVoters.map((vote) => (
            <div class="vote-row">
              <User
                user={
                  new AddressInfo(null, vote.voter, app.activeChainId(), null)
                }
                linkify
                popover
              />
              <CWText className="column-text" noWrap>
                {choices[vote.choice - 1]}
              </CWText>
              <CWText className="column-text" noWrap>
                {formatNumberLong(vote.balance)} {symbol}
              </CWText>
            </div>
          ))}
          <div class="view-more-footer" onclick={toggleExpandedVoterList}>
            <CWText className="view-more-text" fontWeight="medium">
              View More
            </CWText>
          </div>
        </div>
      </div>
    );
  }
}
