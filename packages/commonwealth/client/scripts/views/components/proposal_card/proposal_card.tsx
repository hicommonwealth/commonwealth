/* @jsx m */

import m from 'mithril';
import { Tag } from 'construct-ui';

import 'components/proposal_card.scss';

import app from 'state';
import { navigateToSubpage } from 'app';
import { slugify } from 'utils';
import { AnyProposal } from 'models';
import { ProposalType } from 'common-common/src/types';
import {
  proposalSlugToChainEntityType,
  chainEntityTypeToProposalShortName,
  getProposalUrlPath,
} from 'identifiers';
import { SubstrateTreasuryProposal } from 'controllers/chain/substrate/treasury_proposal';
import { SubstrateCollectiveProposal } from 'controllers/chain/substrate/collective_proposal';
import SubstrateDemocracyProposal from 'controllers/chain/substrate/democracy_proposal';
import { SubstrateDemocracyReferendum } from 'controllers/chain/substrate/democracy_referendum';
import AaveProposal from 'controllers/chain/ethereum/aave/proposal';
import { CWIcon } from '../component_kit/cw_icons/cw_icon';
import { CWCard } from '../component_kit/cw_card';
import { getStatusClass, getStatusText } from './helpers';

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
          <Tag
            label={[
              chainEntityTypeToProposalShortName(
                proposalSlugToChainEntityType(proposal.slug)
              ),
              ' ',
              proposal.shortIdentifier,
            ]}
            intent="primary"
            rounded={true}
            size="xs"
          />
          {(proposal instanceof SubstrateDemocracyProposal ||
            proposal instanceof SubstrateCollectiveProposal) &&
            proposal.getReferendum() && (
              <Tag
                label={`REF #${proposal.getReferendum().identifier}`}
                intent="primary"
                rounded={true}
                size="xs"
                class="proposal-became-tag"
              />
            )}
          {proposal instanceof SubstrateDemocracyReferendum &&
            (() => {
              const originatingProposalOrMotion = proposal.getProposalOrMotion(
                proposal.preimage
              );
              return (
                <Tag
                  label={
                    originatingProposalOrMotion instanceof
                    SubstrateDemocracyProposal
                      ? `PROP #${originatingProposalOrMotion.identifier}`
                      : originatingProposalOrMotion instanceof
                        SubstrateCollectiveProposal
                      ? `MOT #${originatingProposalOrMotion.identifier}`
                      : 'MISSING PROP'
                  }
                  intent="primary"
                  rounded={true}
                  size="xs"
                  class="proposal-became-tag"
                />
              );
            })()}
          {proposal instanceof SubstrateTreasuryProposal &&
            !proposal.data.index && (
              <Tag
                label="MISSING DATA"
                intent="primary"
                rounded={true}
                size="xs"
                class="proposal-became-tag"
              />
            )}
          <div class="proposal-title" title={proposal.title}>
            {proposal.title}
          </div>
          {proposal instanceof SubstrateTreasuryProposal && (
            <div class="proposal-amount">{proposal.value?.format(true)}</div>
          )}
          {proposal instanceof SubstrateDemocracyReferendum && (
            <div class="proposal-amount">{proposal.threshold}</div>
          )}
          {proposal instanceof AaveProposal && (
            <p class="card-subheader">
              {proposal.ipfsData?.shortDescription || 'Proposal'}
            </p>
          )}
          {/* linked treasury proposals
            proposal instanceof SubstrateDemocracyReferendum && proposal.preimage?.section === 'treasury'
               && proposal.preimage?.method === 'approveProposal'
              && m('.proposal-action', [ 'Approves TRES-', proposal.preimage?.args[0] ]),
             proposal instanceof SubstrateDemocracyProposal && proposal.preimage?.section === 'treasury'
              && proposal.preimage?.method === 'approveProposal'
              && m('.proposal-action', [ 'Approves TRES-', proposal.preimage?.args[0] ]),
             proposal instanceof SubstrateCollectiveProposal && proposal.call?.section === 'treasury'
               && proposal.call?.method === 'approveProposal'
               && m('.proposal-action', [ 'Approves TRES-', proposal.call?.args[0] ]),
             linked referenda */}
        </div>
        {injectedContent ? (
          <div class="proposal-injected">{injectedContent}</div>
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
