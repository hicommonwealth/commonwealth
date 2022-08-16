/* @jsx m */

import m from 'mithril';

import 'components/proposal_card/index.scss';

import app from 'state';
import { navigateToSubpage } from 'app';
import { slugify } from 'utils';
import { AnyProposal } from 'models';
import { ProposalType } from 'common-common/src/types';
import { getProposalUrlPath } from 'identifiers';
import { SubstrateTreasuryProposal } from 'controllers/chain/substrate/treasury_proposal';
import { SubstrateDemocracyReferendum } from 'controllers/chain/substrate/democracy_referendum';
import AaveProposal from 'controllers/chain/ethereum/aave/proposal';
import { CWIcon } from '../component_kit/cw_icons/cw_icon';
import { CWCard } from '../component_kit/cw_card';
import {
  getSecondaryTagText,
  getStatusClass,
  getStatusText,
  primaryTagText,
} from './helpers';
import { CWText } from '../component_kit/cw_text';
import { CWDivider } from '../component_kit/cw_divider';
import { ProposalTag } from './proposal_tag';

type ProposalCardAttrs = {
  injectedContent?: any;
  proposal: AnyProposal;
};

export class ProposalCard implements m.ClassComponent<ProposalCardAttrs> {
  view(vnode) {
    const { proposal, injectedContent } = vnode.attrs;

    return (
      <CWCard
        elevation="elevation-2"
        interactive
        className="ProposalCard"
        onclick={(e) => {
          e.stopPropagation();
          e.preventDefault();

          localStorage[`${app.activeChainId()}-proposals-scrollY`] =
            window.scrollY;

          const path = getProposalUrlPath(
            proposal.slug,
            `${proposal.identifier}-${slugify(proposal.title)}`,
            true
          );

          navigateToSubpage(path); // avoid resetting scroll point
        }}
      >
        <div class="proposal-card-metadata">
          <ProposalTag label={primaryTagText(proposal)} />
          {!!getSecondaryTagText(proposal) && (
            <ProposalTag label={getSecondaryTagText(proposal)} />
          )}
          <CWText title={proposal.title} fontWeight="medium">
            {proposal.title}
          </CWText>
          {proposal instanceof SubstrateTreasuryProposal && (
            <div class="proposal-amount">{proposal.value?.format(true)}</div>
          )}
          {proposal instanceof SubstrateDemocracyReferendum && (
            <div class="proposal-amount">{proposal.threshold}</div>
          )}
          {proposal instanceof AaveProposal &&
            proposal.ipfsData?.shortDescription && (
              <CWText type="caption">
                {proposal.ipfsData?.shortDescription}
              </CWText>
            )}
        </div>
        {injectedContent ? (
          <>
            <CWDivider />
            <div class="proposal-injected">{injectedContent}</div>
          </>
        ) : proposal.isPassing !== 'none' ? (
          <div class={`proposal-status ${getStatusClass(proposal)}`}>
            {getStatusText(proposal)}
          </div>
        ) : null}
        {proposal.threadId && (
          <div class="proposal-thread-link">
            <a
              href={getProposalUrlPath(
                ProposalType.Thread,
                `${proposal.threadId}`
              )}
              onclick={(e) => {
                e.stopPropagation();
                e.preventDefault();

                localStorage[`${app.activeChainId()}-proposals-scrollY`] =
                  window.scrollY;

                navigateToSubpage(
                  getProposalUrlPath(
                    ProposalType.Thread,
                    `${proposal.threadId}`,
                    true
                  )
                );

                // avoid resetting scroll point
              }}
            >
              <CWIcon iconName="expand" iconSize="small" />
              <span>
                {proposal.threadTitle ? proposal.threadTitle : 'Go to thread'}
              </span>
            </a>
          </div>
        )}
      </CWCard>
    );
  }
}

//  linked treasury proposals
//   proposal instanceof SubstrateDemocracyReferendum && proposal.preimage?.section === 'treasury'
//      && proposal.preimage?.method === 'approveProposal'
//     && m('.proposal-action', [ 'Approves TRES-', proposal.preimage?.args[0] ]),
//    proposal instanceof SubstrateDemocracyProposal && proposal.preimage?.section === 'treasury'
//     && proposal.preimage?.method === 'approveProposal'
//     && m('.proposal-action', [ 'Approves TRES-', proposal.preimage?.args[0] ]),
//    proposal instanceof SubstrateCollectiveProposal && proposal.call?.section === 'treasury'
//      && proposal.call?.method === 'approveProposal'
//      && m('.proposal-action', [ 'Approves TRES-', proposal.call?.args[0] ]),
//    linked referenda
