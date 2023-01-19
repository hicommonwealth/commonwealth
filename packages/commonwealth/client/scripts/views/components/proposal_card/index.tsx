/* @jsx jsx */
import React from 'react';


import { ClassComponent, ResultNode, render, setRoute, getRoute, getRouteParam, redraw, Component, jsx } from 'mithrilInterop';

import 'components/proposal_card/index.scss';

import app from 'state';
import { navigateToSubpage } from 'app';
import { slugify } from 'utils';
import { isNotNil } from 'helpers/typeGuards';
import { AnyProposal } from 'models';
import { ProposalType } from 'common-common/src/types';
import { getProposalUrlPath } from 'identifiers';
import { SubstrateTreasuryProposal } from 'controllers/chain/substrate/treasury_proposal';
import { SubstrateDemocracyReferendum } from 'controllers/chain/substrate/democracy_referendum';
import AaveProposal from 'controllers/chain/ethereum/aave/proposal';
import { CWCard } from '../component_kit/cw_card';
import {
  getSecondaryTagText,
  getStatusClass,
  getStatusText,
  getPrimaryTagText,
} from './helpers';
import { CWText } from '../component_kit/cw_text';
import { CWDivider } from '../component_kit/cw_divider';
import { ProposalTag } from './proposal_tag';

type ProposalCardAttrs = {
  injectedContent?: ResultNode;
  proposal: AnyProposal;
};

export class ProposalCard extends ClassComponent<ProposalCardAttrs> {
  view(vnode: ResultNode<ProposalCardAttrs>) {
    const { proposal, injectedContent } = vnode.attrs;

    const secondaryTagText = getSecondaryTagText(proposal);

    return (
      <CWCard
        elevation="elevation-2"
        interactive
        className="ProposalCard"
        onClick={(e) => {
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
        <div className="proposal-card-metadata">
          <div className="tag-row">
            <ProposalTag label={getPrimaryTagText(proposal)} />
            {isNotNil(secondaryTagText) && (
              <ProposalTag label={secondaryTagText} />
            )}
          </div>
          <CWText title={proposal.title} fontWeight="semiBold" noWrap>
            {proposal.title}
          </CWText>
          {proposal instanceof SubstrateTreasuryProposal && (
            <CWText className="proposal-amount-text">
              {proposal.value?.format(true)}
            </CWText>
          )}
          {proposal instanceof SubstrateDemocracyReferendum && (
            <CWText className="proposal-amount-text">
              {proposal.threshold}
            </CWText>
          )}
          {proposal instanceof AaveProposal &&
            proposal.ipfsData?.shortDescription && (
              <CWText type="caption">
                {proposal.ipfsData?.shortDescription}
              </CWText>
            )}
        </div>
        {injectedContent ? (
          <React.Fragment>
            <CWDivider />
            <div className="proposal-injected">{injectedContent}</div>
          </React.Fragment>
        ) : proposal.isPassing !== 'none' ? (
          <CWText
            fontWeight="medium"
            className={`proposal-status-text ${getStatusClass(proposal)}`}
          >
            {getStatusText(proposal)}
          </CWText>
        ) : null}
        {proposal.threadId && (
          <CWText type="caption" className="proposal-thread-link-text">
            <a
              href={getProposalUrlPath(
                ProposalType.Thread,
                `${proposal.threadId}`
              )}
              onClick={(e) => {
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
              {proposal.threadTitle ? proposal.threadTitle : 'Go to thread'}
            </a>
          </CWText>
        )}
      </CWCard>
    );
  }
}

//  linked treasury proposals
//   proposal instanceof SubstrateDemocracyReferendum && proposal.preimage?.section === 'treasury'
//      && proposal.preimage?.method === 'approveProposal'
//     && render('.proposal-action', [ 'Approves TRES-', proposal.preimage?.args[0] ]),
//    proposal instanceof SubstrateDemocracyProposal && proposal.preimage?.section === 'treasury'
//     && proposal.preimage?.method === 'approveProposal'
//     && render('.proposal-action', [ 'Approves TRES-', proposal.preimage?.args[0] ]),
//    proposal instanceof SubstrateCollectiveProposal && proposal.call?.section === 'treasury'
//      && proposal.call?.method === 'approveProposal'
//      && render('.proposal-action', [ 'Approves TRES-', proposal.call?.args[0] ]),
//    linked referenda
