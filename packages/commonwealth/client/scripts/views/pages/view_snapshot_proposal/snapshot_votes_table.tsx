/* @jsx m */

import m from 'mithril';
import Infinite from 'mithril-infinite';

import 'pages/snapshot/snapshot_votes_table.scss';

import app from 'state';
import { SnapshotProposalVote } from 'helpers/snapshot_utils';
import { AddressInfo } from 'models';
import { formatNumberLong } from 'helpers';
import User from '../../components/widgets/user';
import { CWText } from '../../components/component_kit/cw_text';

type SnapshotVoteRowAttrs = {
  choice: string;
  symbol: string;
  vote: SnapshotProposalVote;
};

class SnapshotVoteRow implements m.ClassComponent<SnapshotVoteRowAttrs> {
  view(vnode: m.VnodeDOM<SnapshotVoteRowAttrs, this>) {
    const { choice, symbol, vote } = vnode.attrs;

    console.log('in');

    return (
      <div class="vote-row">
        {m(User, {
          user: new AddressInfo(null, vote.voter, app.activeChainId(), null),
          linkify: true,
          popover: true,
        })}
        <CWText className="column-text" noWrap>
          {choice}
        </CWText>
        <CWText className="column-text" noWrap>
          {formatNumberLong(vote.balance)} {symbol}
        </CWText>
      </div>
    );
  }
}

type SnapshotVotesTableAttrs = {
  choices: Array<string>;
  displayedVoters: Array<SnapshotProposalVote>;
  symbol: string;
  toggleExpandedVoterList: () => void;
  voteCount: number;
};

export class SnapshotVotesTable
  implements m.ClassComponent<SnapshotVotesTableAttrs>
{
  view(vnode: m.VnodeDOM<SnapshotVotesTableAttrs, this>) {
    const {
      choices,
      displayedVoters,
      symbol,
      toggleExpandedVoterList,
      voteCount,
    } = vnode.attrs;

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
          {/* <div style="height: 240px;"> */}
          <Infinite
            maxPages={1} // prevents rollover/repeat
            pageData={() => displayedVoters}
            processPageData={(content) => (
              <>
                {content.map((item, _, i) => {
                  console.log(item);
                  return m('div', { class: 'vote-row', key: i }, [
                    item.balance,
                  ]);
                })}
              </>
            )} // limit the number of rows shown here
            // pageSize={() => 10 * 24}
            // contentSize={10 * 24}
            // key={
            //   'discussion'
            // }
            // item={(data, opts, i) => {
            //   console.log(data);
            //   return m('div', { class: 'vote-row' }, [data.balance]);
            // <CWText className="column-text" noWrap key={i}>
            //   {data.choice}
            // </CWText>
            //   <CWText className="column-text" noWrap>
            //     {formatNumberLong(data.balance)} {symbol}
            //   </CWText>
            // </div>
            // <SnapshotVoteRow
            //   vote={data.voter}
            //   choice={choices[data.choice - 1]}
            //   symbol={symbol}
            // />
            // }}
          />
          {/* </div> */}
          {/* {displayedVoters.map((vote) => (
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
          ))} */}
          {/* <div class="view-more-footer" onclick={toggleExpandedVoterList}>
            <CWText className="view-more-text" fontWeight="medium">
              View More
            </CWText>
          </div> */}
        </div>
      </div>
    );
  }
}
