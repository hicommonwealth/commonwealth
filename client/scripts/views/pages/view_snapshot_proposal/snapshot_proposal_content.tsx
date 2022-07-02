/* @jsx m */

import m from 'mithril';

import moment from 'moment';

import 'pages/snapshot/snapshot_proposal_content.scss';

import app from 'state';
import { AddressInfo } from 'models';
import { SnapshotProposal, SnapshotProposalVote } from 'helpers/snapshot_utils';
import { formatNumberLong, formatTimestamp } from 'helpers';
import User from '../../components/widgets/user';
import { MarkdownFormattedText } from '../../components/markdown_formatted_text';
import { CWText } from '../../components/component_kit/cw_text';

type SnapshotProposalContentAttrs = {
  proposal: SnapshotProposal;
  symbol: string;
  votes: SnapshotProposalVote[];
};

export class SnapshotProposalContent
  implements m.ClassComponent<SnapshotProposalContentAttrs>
{
  private votersListExpanded: boolean;

  oncreate() {
    this.votersListExpanded = false;
  }

  view(vnode) {
    const { proposal, votes, symbol } = vnode.attrs;

    const votersList = this.votersListExpanded ? votes : votes.slice(0, 10);

    return (
      <div class="SnapshotProposalContent">
        <div class="snapshot-proposal-content-header">
          <CWText type="h3" fontWeight="semiBold">
            {proposal.title}
          </CWText>
          {/* <CWText noWrap className="snapshot-proposal-hash">
          #{proposal.ipfs}
        </CWText>
        <div class="other-details">
          <div class="author-row">
            <CWText>Submitted by</CWText>
            <div class="author-address">
              {m(User, {
                user: new AddressInfo(
                  null,
                  proposal.author,
                  app.activeChainId(),
                  null
                ),
                linkify: true,
                popover: true,
              })}
            </div>
          </div>
        </div> */}
          {proposal.state === 'active' ? (
            <div class="active-proposal">
              <span>
                Ends in ${formatTimestamp(moment(+proposal.end * 1000))}
              </span>
              <div class="active-text">Active</div>
            </div>
          ) : (
            <div class="closed-proposal">{proposal.state}</div>
          )}
        </div>
        <MarkdownFormattedText doc={proposal.body} />
        {votes.length > 0 && (
          <>
            <div class="votes-title">
              <div class="title">Votes</div>
              <div class="vote-count">{votes.length}</div>
            </div>
            <div class="votes-container">
              <div class="t-head">
                <div class="user-column">User</div>
                <div class="user-column">Vote</div>
                <div class="user-column">Power</div>
              </div>
              {votersList.map((vote) => (
                <div class="vote-row">
                  <div class="user-column">
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
                  </div>
                  <div class="vote-column">
                    {proposal.choices[vote.choice - 1]}
                  </div>
                  <div class="power-column">
                    ${formatNumberLong(vote.balance)} ${symbol}
                  </div>
                </div>
              ))}
              <button
                class="view-more-button"
                onclick={() => {
                  this.votersListExpanded = true;
                  m.redraw();
                }}
              >
                VIEW MORE
              </button>
            </div>
          </>
        )}
      </div>
    );
  }
}
