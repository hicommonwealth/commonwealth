/* @jsx m */

import m from 'mithril';

import AaveProposal from 'controllers/chain/ethereum/aave/proposal';
import { roundVote } from '../../components/proposals/aave_proposal_card_detail';
import { CWText } from '../../components/component_kit/cw_text';

export class AaveViewProposalDetail
  implements m.ClassComponent<{ proposal: AaveProposal }>
{
  view(vnode) {
    const { proposal } = vnode.attrs;

    return (
      <div class="AaveViewProposalDetail">
        <CWText type="h4" fontWeight="semiBold">
          Voting
        </CWText>
        <div>
          <CWText type="h5" fontWeight="semiBold">
            {roundVote(proposal.turnout * 100)}%
          </CWText>
          <CWText>of token holders</CWText>
        </div>
        <div>
          <CWText type="h5" fontWeight="semiBold">
            {roundVote(proposal.support * 100)}%
          </CWText>
          <CWText>in favor</CWText>
        </div>
        <div>
          <CWText type="h5" fontWeight="semiBold">
            {roundVote(proposal.voteDifferential * 100)}%
          </CWText>
          <CWText>differential</CWText>
        </div>
        <div>
          <CWText type="h5" fontWeight="semiBold">
            {proposal.minimumQuorum * 100}%
          </CWText>
          <CWText>of token holders required to pass</CWText>
        </div>
        <div>
          <CWText type="h5" fontWeight="semiBold">
            {proposal.minimumVoteDifferential * 100}%
          </CWText>
          <CWText>differential required to pass</CWText>
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
        <CWText type="h4" fontWeight="semiBold">
          Simple Summary
        </CWText>
        <CWText>{proposal.ipfsData?.shortDescription}</CWText>
      </div>
    );
  }
}
