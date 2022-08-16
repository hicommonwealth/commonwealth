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
            {proposal.ipfsData?.author
              ? proposal.ipfsData.author.split(' (').map((ele, idx) => {
                  return idx === 0 ? (
                    <CWText>{ele}</CWText>
                  ) : (
                    <CWText type="caption" className="ipfs-subheader-text">
                      {ele.slice(0, ele.length - 1)}
                    </CWText>
                  );
                })
              : m(User, {
                  user: proposal.author,
                  hideAvatar: true,
                  linkify: true,
                })}
          </div>
          <div class="aave-metadata-column">
            <CWLabel label="Status" />
            <CWText noWrap>{statusText}</CWText>
          </div>
        </div>
        <div class="aave-voting">
          <CWText>Voting</CWText>
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
        </div>
        <div class="aave-requirements">
          <CWText>Required to pass</CWText>
          <div>
            <CWText type="h5" fontWeight="semiBold">
              {proposal.minimumQuorum * 100}%
            </CWText>
            <CWText>of token holders</CWText>
          </div>
          <div>
            <CWText type="h5" fontWeight="semiBold">
              {proposal.minimumVoteDifferential * 100}%
            </CWText>
            <CWText>differential</CWText>
          </div>
        </div>
      </div>
    );
  }
}
