import React from 'react';

import { formatNumberLong } from 'helpers';
import { AddressInfo } from 'models';
import {
  ClassComponent,
  ResultNode,
  render,
  setRoute,
  getRoute,
  getRouteParam,
  redraw,
  Component,
} from 'mithrilInterop';

import 'pages/snapshot/snapshot_votes_table.scss';

import app from 'state';
import { CWText } from '../../components/component_kit/cw_text';
import { User } from '../../components/user/user';

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
            <CWText className="vote-count-text" fontWeight="medium">
              {voters.length}
            </CWText>
          </div>
        </div>
        <div className="votes-container">
          <div className="column-header-row">
            <CWText type="h5" className="column-header-text">
              {app.chain ? 'User' : 'Address'}
            </CWText>
            <CWText type="h5" className="column-header-text">
              Vote
            </CWText>
            <CWText type="h5" className="column-header-text">
              Power
            </CWText>
          </div>
          {displayedVoters.map((vote) => (
            <div className="vote-row">
              {app.chain ? (
                <User
                  user={
                    new AddressInfo(null, vote.voter, app.activeChainId(), null)
                  }
                  linkify
                  popover
                />
              ) : (
                <CWText className="column-text">
                  {`${vote.voter.slice(0, 15)}...`}
                </CWText>
              )}
              <CWText className="column-text" noWrap>
                {choices[vote.choice - 1]}
              </CWText>
              <CWText className="column-text" noWrap>
                {formatNumberLong(vote.balance)} {symbol}
              </CWText>
            </div>
          ))}
          <div className="view-more-footer" onClick={toggleExpandedVoterList}>
            <CWText className="view-more-text" fontWeight="medium">
              View More
            </CWText>
          </div>
        </div>
      </div>
    );
  }
}
