import React from 'react';

import { ClassComponent, ResultNode} from

 'mithrilInterop';

import 'components/proposals/aave_proposal_card_detail.scss';

import AaveProposal from 'controllers/chain/ethereum/aave/proposal';
import { User } from '../user/user';
import { CWLabel } from '../component_kit/cw_label';
import { CWText } from '../component_kit/cw_text';

export const roundVote = (percentage) => {
  return percentage.toFixed(2).split('.0')[0].slice(0, 4);
};

type AaveInfoRowAttrs = { aaveNum: number; aaveText: string };

export class AaveInfoRow extends ClassComponent<AaveInfoRowAttrs> {
  view(vnode: ResultNode<AaveInfoRowAttrs>) {
    const { aaveNum, aaveText } = vnode.attrs;

    return (
      <div className="AaveInfoRow">
        <CWText type="h5" fontWeight="semiBold" className="aave-num-text">
          {roundVote(aaveNum * 100)}%
        </CWText>
        <CWText noWrap>{aaveText}</CWText>
      </div>
    );
  }
}

type AaveProposalCardDetailAttrs = {
  proposal: AaveProposal;
  statusText: any;
};

export class AaveProposalCardDetail extends ClassComponent<AaveProposalCardDetailAttrs> {
  view(vnode: ResultNode<AaveProposalCardDetailAttrs>) {
    const { proposal } = vnode.attrs;

    const statusText = Array.isArray(vnode.attrs.statusText)
      ? vnode.attrs.statusText[0]?.split(',')[0]
      : vnode.attrs.statusText;

    // TODO: move executor display to entire page
    // TODO: display stats about voting turnout/etc
    // const executor = proposal.Executor;

    return (
      <div className="AaveProposalCardDetail">
        <div className="aave-metadata-container">
          <div className="aave-metadata-column">
            <CWLabel label="Author" />
            {proposal.ipfsData?.author ? (
              <CWText title={proposal.ipfsData.author.split(' (')[0]} noWrap>
                {proposal.ipfsData.author.split(' (')[0]}
              </CWText>
            ) : (
              <User user={proposal.author} hideAvatar linkify />
            )}
          </div>
          <div className="aave-metadata-column">
            <CWLabel label="Status" />
            <CWText noWrap>{statusText}</CWText>
          </div>
        </div>
        <div className="aave-voting-section">
          <CWLabel label="Voting" />
          <AaveInfoRow aaveNum={proposal.turnout} aaveText="of token holders" />
          <AaveInfoRow aaveNum={proposal.support} aaveText="in favor" />
          <AaveInfoRow
            aaveNum={proposal.voteDifferential}
            aaveText="differential"
          />
        </div>
        <div className="aave-voting-section">
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
