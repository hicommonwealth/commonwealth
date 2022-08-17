/* @jsx m */

import m from 'mithril';

import 'components/proposals/aave_proposal_card_detail.scss';

import AaveProposal from 'controllers/chain/ethereum/aave/proposal';
import User from '../widgets/user';
import { CWText } from '../component_kit/cw_text';
import { CWLabel } from '../component_kit/cw_label';

export const roundVote = (percentage) => {
  return percentage.toFixed(2).split('.0')[0].slice(0, 4);
};

type AaveProposalCardDetailAttrs = {
  proposal: AaveProposal;
  statusText: any;
};

export class AaveInfoRow
  implements m.ClassComponent<{ aaveNum: number; aaveText: string }>
{
  view(vnode) {
    const { aaveNum, aaveText } = vnode.attrs;

    return (
      <div class="AaveInfoRow">
        <CWText type="h5" fontWeight="semiBold" className="aave-num-text">
          {roundVote(aaveNum * 100)}%
        </CWText>
        <CWText noWrap>{aaveText}</CWText>
      </div>
    );
  }
}

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
      <div class="AaveProposalCardDetail">
        <div class="aave-metadata-container">
          <div class="aave-metadata-column">
            <CWLabel label="Author" />
            {proposal.ipfsData?.author ? (
              <CWText title={proposal.ipfsData.author.split(' (')[0]} noWrap>
                {proposal.ipfsData.author.split(' (')[0]}
              </CWText>
            ) : (
              m(User, {
                user: proposal.author,
                hideAvatar: true,
                linkify: true,
              })
            )}
          </div>
          <div class="aave-metadata-column">
            <CWLabel label="Status" />
            <CWText noWrap>{statusText}</CWText>
          </div>
        </div>
        <div class="aave-voting-section">
          <CWLabel label="Voting" />
          <AaveInfoRow aaveNum={proposal.turnout} aaveText="of token holders" />
          <AaveInfoRow aaveNum={proposal.support} aaveText="in favor" />
          <AaveInfoRow
            aaveNum={proposal.voteDifferential}
            aaveText="differential"
          />
        </div>
        <div class="aave-voting-section">
          <CWLabel label="Required to pass" />
          <AaveInfoRow
            aaveNum={proposal.minimumQuorum}
            aaveText="of token holders"
          />
          <AaveInfoRow
            aaveNum={proposal.minimumVoteDifferential}
            aaveText="differential"
          />
        </div>
      </div>
    );
  }
}
