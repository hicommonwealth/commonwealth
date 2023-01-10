/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';

import 'pages/view_proposal/aave_summary.scss';

import type AaveProposal from 'controllers/chain/ethereum/aave/proposal';
import { AaveInfoRow } from '../../components/proposals/aave_proposal_card_detail';
import { CWText } from '../../components/component_kit/cw_text';

type AaveViewProposalDetailAttrs = {
  proposal: AaveProposal;
};

export class AaveViewProposalDetail extends ClassComponent<AaveViewProposalDetailAttrs> {
  view(vnode: m.Vnode<AaveViewProposalDetailAttrs>) {
    const { proposal } = vnode.attrs;

    return (
      <div class="AaveSummary">
        {proposal.ipfsData?.shortDescription && (
          <div>
            <CWText type="h4" fontWeight="semiBold">
              Simple Summary
            </CWText>
            <CWText>{proposal.ipfsData?.shortDescription}</CWText>
          </div>
        )}
        <CWText type="h4" fontWeight="semiBold">
          Voting
        </CWText>
        <AaveInfoRow aaveNum={proposal.turnout} aaveText="of token holders" />
        <AaveInfoRow aaveNum={proposal.support} aaveText="in favor" />
        <AaveInfoRow
          aaveNum={proposal.voteDifferential}
          aaveText="differential"
        />
        <AaveInfoRow
          aaveNum={proposal.minimumQuorum}
          aaveText="of token holders required to pass"
        />
        <AaveInfoRow
          aaveNum={proposal.minimumVoteDifferential}
          aaveText="differential required to pass"
        />
      </div>
    );
  }
}
