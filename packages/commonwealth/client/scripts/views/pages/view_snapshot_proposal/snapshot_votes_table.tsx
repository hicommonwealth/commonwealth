/* @jsx jsx */


import { ClassComponent, ResultNode, render, setRoute, getRoute, getRouteParam, redraw, Component, jsx } from 'mithrilInterop';

import 'pages/snapshot/snapshot_votes_table.scss';

import app from 'state';
import { AddressInfo } from 'models';
import { formatNumberLong } from 'helpers';
import User from '../../components/widgets/user';
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

  view(vnode: ResultNode<SnapshotVotesTableAttrs>) {
    const { choices, symbol, voters } = vnode.attrs;

    const toggleExpandedVoterList = () => {
      this.isVotersListExpanded = !this.isVotersListExpanded;
      redraw();
    };

    const displayedVoters = this.isVotersListExpanded
      ? voters
      : voters.slice(0, 10);

    return (
      <div className="SnapshotVotesTable">
        <div className="votes-header-row">
          <CWText type="h4" fontWeight="semiBold">
            Votes
          </CWText>
          <div className="vote-count">
            <CWText class="vote-count-text" fontWeight="medium">
              {voters.length}
            </CWText>
          </div>
        </div>
        <div className="votes-container">
          <div className="column-header-row">
            <CWText type="h5" class="column-header-text">
              User
            </CWText>
            <CWText type="h5" class="column-header-text">
              Vote
            </CWText>
            <CWText type="h5" class="column-header-text">
              Power
            </CWText>
          </div>
          {displayedVoters.map((vote) => (
            <div className="vote-row">
              {render(User, {
                user: new AddressInfo(
                  null,
                  vote.voter,
                  app.activeChainId(),
                  null
                ),
                linkify: true,
                popover: true,
              })}
              <CWText class="column-text" noWrap>
                {choices[vote.choice - 1]}
              </CWText>
              <CWText class="column-text" noWrap>
                {formatNumberLong(vote.balance)} {symbol}
              </CWText>
            </div>
          ))}
          <div className="view-more-footer" onClick={toggleExpandedVoterList}>
            <CWText class="view-more-text" fontWeight="medium">
              View More
            </CWText>
          </div>
        </div>
      </div>
    );
  }
}
