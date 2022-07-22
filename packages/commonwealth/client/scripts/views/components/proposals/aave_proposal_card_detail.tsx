/* @jsx m */

import m from 'mithril';

import 'components/proposals/aave_detail.scss';

import AaveProposal from 'client/scripts/controllers/chain/ethereum/aave/proposal';
import User from '../widgets/user';

export const roundVote = (percentage) => {
  return percentage.toFixed(2).split('.0')[0].slice(0, 4);
};

type AaveProposalCardDetailAttrs = {
  proposal: AaveProposal;
  statusText: any;
};

export class AaveProposalCardDetail
  implements m.ClassComponent<AaveProposalCardDetailAttrs>
{
  view(vnode) {
    const { proposal } = vnode.attrs;

    const statusText = Array.isArray(vnode.attrs.statusText)
      ? vnode.attrs.statusText[0]?.split(',')[0]
      : vnode.attrs.statusText;

    // TODO: move executor display to entire page
    // TODO: display stats about voting turnout/etc
    // const executor = proposal.Executor;

    return (
      <div
        class="AaveProposalCardDetail"
        onclick={(e) => {
          e.preventDefault();
        }}
      >
        <div class="aave-metadata">
          <div class="aave-author">
            <div class="card-subheader">Author</div>
            {proposal.ipfsData?.author
              ? proposal.ipfsData.author.split(' (').map((ele, idx) => {
                  return idx === 0 ? (
                    <p class="collapsed-line-height">{ele}</p>
                  ) : (
                    <p class="card-subheader">{ele.slice(0, ele.length - 1)}</p>
                  );
                })
              : m(User, { user: proposal.author, popover: true })}
          </div>
          <div class="aave-status">
            <div class="card-subheader">Status</div>
            <div class="proposal-injected-status">{statusText}</div>
          </div>
        </div>
        <div class="aave-voting">
          <div class="card-subheader">Voting</div>
          <div class="aave-turnout">
            <p class="detail-highlight emphasize">
              {roundVote(proposal.turnout * 100)}%
            </p>
            <p>of token holders</p>
          </div>
          <div class="aave-support">
            <p class="detail-highlight emphasize">
              {roundVote(proposal.support * 100)}%
            </p>
            <p>in favor</p>
          </div>
          <div class="aave-differential">
            <p class="detail-highlight emphasize">
              {roundVote(proposal.voteDifferential * 100)}%
            </p>
            <p>differential</p>
          </div>
        </div>
        <div class="aave-requirements">
          <div class="card-subheader">Required to pass</div>
          <div class="aave-turnout-requirement">
            <p class="detail-highlight emphasize">
              {proposal.minimumQuorum * 100}%
            </p>
            <p>of token holders</p>
          </div>
          <div class="aave-differential-requirement">
            <p class="detail-highlight emphasize">
              {proposal.minimumVoteDifferential * 100}%
            </p>
            <p>differential</p>
          </div>
        </div>
      </div>
    );
  }
}
