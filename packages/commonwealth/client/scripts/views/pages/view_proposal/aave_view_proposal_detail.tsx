/* @jsx m */

import m from 'mithril';

import AaveProposal from 'controllers/chain/ethereum/aave/proposal';
import { roundVote } from '../../components/proposals/aave_proposal_card_detail';

export class AaveViewProposalDetail
  implements m.ClassComponent<{ proposal: AaveProposal }>
{
  view(vnode) {
    const { proposal } = vnode.attrs;

    return (
      <div class="AaveViewProposalDetail">
        <h3>Voting</h3>
        <div class="aave-turnout">
          <p class="detail-highlight emphasize">
            {roundVote(proposal.turnout * 100)}%
          </p>
          <p> of token holders</p>
        </div>
        <div class="aave-support">
          <p class="detail-highlight emphasize">
            {roundVote(proposal.support * 100)}%
          </p>
          <p> in favor</p>
        </div>
        <div class="aave-differential">
          <p class="detail-highlight emphasize">
            {roundVote(proposal.voteDifferential * 100)}%
          </p>
          <p> differential</p>
        </div>
        <div class="aave-turnout-requirement">
          <p class="detail-highlight emphasize">
            {proposal.minimumQuorum * 100}%
          </p>
          <p> of token holders required to pass</p>
        </div>
        <div class="aave-differential-requirement">
          <p class="detail-highlight emphasize">
            {proposal.minimumVoteDifferential * 100}%
          </p>
          <p> differential required to pass</p>
        </div>
      </div>
    );
  }
}

export class AaveViewProposalSummary
  implements m.ClassComponent<{ proposal: AaveProposal }>
{
  view(vnode) {
    const { proposal } = vnode.attrs;

    if (!proposal.ipfsData?.shortDescription) return;

    return (
      <div class="AaveViewProposalSummary">
        <h3>Simple Summary</h3>
        <div class="aave-summary">{proposal.ipfsData?.shortDescription}</div>
      </div>
    );
  }
}
