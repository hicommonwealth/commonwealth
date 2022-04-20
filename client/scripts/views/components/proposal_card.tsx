/* @jsx m */

import m from 'mithril';
import moment from 'moment';
import { Tag } from 'construct-ui';
import { AaveTypes, CompoundTypes } from '@commonwealth/chain-events';

import 'components/proposal_card.scss';

import app from 'state';
import { navigateToSubpage } from 'app';
import { slugify } from 'utils';
import { blocknumToDuration, formatNumberLong } from 'helpers';
import { ProposalStatus, AnyProposal } from 'models';
import { ProposalType } from 'types';
import {
  proposalSlugToChainEntityType,
  chainEntityTypeToProposalShortName,
  getProposalUrlPath,
} from 'identifiers';

import { SubstrateTreasuryProposal } from 'controllers/chain/substrate/treasury_proposal';
import { SubstrateCollectiveProposal } from 'controllers/chain/substrate/collective_proposal';
import SubstrateDemocracyProposal from 'controllers/chain/substrate/democracy_proposal';
import { SubstrateDemocracyReferendum } from 'controllers/chain/substrate/democracy_referendum';
import MolochProposal, {
  MolochProposalState,
} from 'controllers/chain/ethereum/moloch/proposal';
import AaveProposal from 'controllers/chain/ethereum/aave/proposal';
import CompoundProposal from 'controllers/chain/ethereum/compound/proposal';

import { Countdown } from 'views/components/countdown';
import { CWIcon } from './component_kit/cw_icons/cw_icon';
import { CWCard } from './component_kit/cw_card';

export const getStatusClass = (proposal: AnyProposal) =>
  proposal.isPassing === ProposalStatus.Passing
    ? 'pass'
    : proposal.isPassing === ProposalStatus.Passed
    ? 'pass'
    : proposal.isPassing === ProposalStatus.Failing
    ? 'fail'
    : proposal.isPassing === ProposalStatus.Failed
    ? 'fail'
    : '';

export const getStatusText = (proposal: AnyProposal) => {
  if (proposal.completed && proposal instanceof SubstrateDemocracyProposal) {
    if (proposal.isPassing === ProposalStatus.Passed)
      return 'Passed, moved to referendum';
    return 'Cancelled';
  } else if (
    proposal.completed &&
    proposal instanceof SubstrateCollectiveProposal
  ) {
    if (
      proposal.isPassing === ProposalStatus.Passed &&
      proposal.call.section === 'treasury' &&
      proposal.call.method === 'approveProposal'
    )
      return 'Passed';
    if (
      proposal.isPassing === ProposalStatus.Passed &&
      proposal.call.section === 'democracy' &&
      proposal.call.method.startsWith('externalPropose')
    )
      return 'Passed, moved to referendum';
    if (proposal.isPassing === ProposalStatus.Passed) return 'Passed';
    if (proposal.isPassing === ProposalStatus.Failed) return 'Motion closed';
    return 'Completed';
  } else if (proposal.completed && proposal instanceof AaveProposal) {
    if (proposal.state === AaveTypes.ProposalState.CANCELED) return 'Cancelled';
    if (proposal.state === AaveTypes.ProposalState.EXECUTED) return 'Executed';
    if (proposal.state === AaveTypes.ProposalState.EXPIRED) return 'Expired';
    if (proposal.state === AaveTypes.ProposalState.FAILED)
      return 'Did not pass';
  } else if (proposal.completed && proposal instanceof CompoundProposal) {
    if (proposal.state === CompoundTypes.ProposalState.Canceled)
      return 'Cancelled';
    if (proposal.state === CompoundTypes.ProposalState.Executed)
      return 'Executed';
    if (proposal.state === CompoundTypes.ProposalState.Expired)
      return 'Expired';
    if (proposal.state === CompoundTypes.ProposalState.Defeated)
      return 'Did not pass';
  } else if (proposal.completed) {
    if (proposal.isPassing === ProposalStatus.Passed) return 'Passed';
    if (proposal.isPassing === ProposalStatus.Failed) return 'Did not pass';
    return 'Completed';
  }

  const countdown =
    proposal.endTime.kind === 'fixed'
      ? [
          <Countdown
            duration={moment.duration(proposal.endTime.time.diff(moment()))}
          />,
          ' left',
        ]
      : proposal.endTime.kind === 'fixed_block'
      ? [
          <Countdown
            duration={blocknumToDuration(proposal.endTime.blocknum)}
          />,
          ` left (ends on block ${formatNumberLong(
            proposal.endTime.blocknum
          )})`,
        ]
      : proposal.endTime.kind === 'dynamic'
      ? [
          <Countdown
            duration={blocknumToDuration(proposal.endTime.getBlocknum())}
          />,
          ` left (ends on block ${formatNumberLong(
            proposal.endTime.getBlocknum()
          )})`,
        ]
      : proposal.endTime.kind === 'threshold'
      ? `needs ${proposal.endTime.threshold} votes`
      : proposal.endTime.kind === 'not_started'
      ? 'not yet started'
      : proposal.endTime.kind === 'queued'
      ? 'in queue'
      : proposal.endTime.kind === 'unavailable'
      ? ''
      : '';

  if (proposal instanceof MolochProposal) {
    if (proposal.state === MolochProposalState.NotStarted)
      return 'Waiting to start';
    if (proposal.state === MolochProposalState.GracePeriod)
      return [
        proposal.isPassing === ProposalStatus.Passed ? 'Passed, ' : 'Failed, ',
        countdown,
        ' in grace period',
      ];
    if (proposal.state === MolochProposalState.InProcessingQueue)
      return 'In processing queue';
    if (proposal.state === MolochProposalState.ReadyToProcess)
      return 'Ready to process';
  }

  if (proposal instanceof AaveProposal) {
    if (proposal.state === AaveTypes.ProposalState.ACTIVE)
      return [
        proposal.isPassing === ProposalStatus.Passing
          ? 'Passing, '
          : 'Not passing, ',
        countdown,
      ];
    if (proposal.state === AaveTypes.ProposalState.PENDING)
      return ['Pending, ', countdown];
    if (proposal.state === AaveTypes.ProposalState.QUEUED)
      return ['Queued, ', countdown];
    if (proposal.state === AaveTypes.ProposalState.SUCCEEDED)
      return 'Ready to queue';
    if (proposal.state === AaveTypes.ProposalState.EXPIRED) return 'Expired';
  }

  if (proposal instanceof CompoundProposal) {
    if (proposal.state === CompoundTypes.ProposalState.Active)
      return [
        proposal.isPassing === ProposalStatus.Passing
          ? 'Passing, '
          : 'Not passing, ',
        countdown,
      ];
    if (proposal.state === CompoundTypes.ProposalState.Pending)
      return ['Pending, ', countdown];
    if (proposal.state === CompoundTypes.ProposalState.Queued)
      return ['Queued, ', countdown];
    if (proposal.state === CompoundTypes.ProposalState.Succeeded)
      return 'Ready to queue';
    if (proposal.state === CompoundTypes.ProposalState.Expired)
      return 'Expired';
  }

  if (proposal.isPassing === ProposalStatus.Passed)
    return [
      'Passed, enacting in ',
      countdown.length === 2 ? countdown[0] : '???',
    ];
  if (proposal.isPassing === ProposalStatus.Failed) return 'Did not pass';
  if (
    proposal.isPassing === ProposalStatus.Passing &&
    proposal instanceof SubstrateDemocracyProposal
  )
    return ['Expected to pass and move to referendum, ', countdown];
  if (proposal.isPassing === ProposalStatus.Passing)
    return ['Passing, ', countdown];
  if (proposal.isPassing === ProposalStatus.Failing)
    return ['Not passing, ', countdown];
  return '';
};

export class ProposalCard
  implements m.ClassComponent<{ proposal: AnyProposal; injectedContent? }>
{
  view(vnode) {
    const { proposal, injectedContent } = vnode.attrs;

    return (
      <CWCard
        elevation="elevation-2"
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
          <div class="proposal-title">{proposal.title}</div>
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
          <div class="proposal-injected">
            {m(injectedContent, {
              proposal,
              statusClass: getStatusClass(proposal),
              statusText: getStatusText(proposal),
            })}
          </div>
        ) : (
          <div class={`proposal-status ${getStatusClass(proposal)}`}>
            {getStatusText(proposal)}
          </div>
        )}
        {proposal.threadId && (
          <div class="proposal-thread-link">
            <a
              href={getProposalUrlPath(
                ProposalType.OffchainThread,
                `${proposal.threadId}`
              )}
              onclick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                localStorage[`${app.activeChainId()}-proposals-scrollY`] =
                  window.scrollY;
                navigateToSubpage(
                  getProposalUrlPath(
                    ProposalType.OffchainThread,
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
