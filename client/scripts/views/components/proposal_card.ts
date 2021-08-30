import 'components/proposal_card.scss';

import m from 'mithril';
import moment from 'moment';
import { Icon, Icons, Tag } from 'construct-ui';
import { AaveTypes } from '@commonwealth/chain-events';

import app from 'state';
import { navigateToSubpage } from 'app';
import { slugify } from 'utils';
import { Coin } from 'adapters/currency';
import { blocknumToDuration, formatLastUpdated, formatPercentShort, link, pluralize } from 'helpers';
import { ProposalStatus, VotingType, AnyProposal, AddressInfo } from 'models';
import { ProposalType, proposalSlugToChainEntityType, chainEntityTypeToProposalShortName } from 'identifiers';

import Substrate from 'controllers/chain/substrate/main';
import { SubstrateTreasuryProposal } from 'controllers/chain/substrate/treasury_proposal';
import { SubstrateCollectiveProposal } from 'controllers/chain/substrate/collective_proposal';
import SubstrateDemocracyProposal from 'controllers/chain/substrate/democracy_proposal';
import { SubstrateDemocracyReferendum } from 'controllers/chain/substrate/democracy_referendum';
import { SubstrateTreasuryTip } from 'controllers/chain/substrate/treasury_tip';
import MolochProposal, { MolochProposalState } from 'controllers/chain/ethereum/moloch/proposal';
import AaveProposal from 'controllers/chain/ethereum/aave/proposal';

import Countdown from 'views/components/countdown';

export const getStatusClass = (proposal: AnyProposal) => proposal.isPassing === ProposalStatus.Passing ? 'pass'
  : proposal.isPassing === ProposalStatus.Passed ? 'pass'
    : proposal.isPassing === ProposalStatus.Failing ? 'fail'
      : proposal.isPassing === ProposalStatus.Failed ? 'fail' : '';

export const getStatusText = (proposal: AnyProposal, showCountdown: boolean) => {
  if (proposal.completed && proposal instanceof SubstrateDemocracyProposal) {
    if (proposal.isPassing === ProposalStatus.Passed) return 'Passed, moved to referendum';
    return 'Cancelled';
  } else if (proposal.completed && proposal instanceof SubstrateCollectiveProposal) {
    if (proposal.isPassing === ProposalStatus.Passed
        && proposal.call.section === 'treasury' && proposal.call.method === 'approveProposal')
      return 'Passed';
    if (proposal.isPassing === ProposalStatus.Passed
        && proposal.call.section === 'democracy' && proposal.call.method.startsWith('externalPropose'))
      return 'Passed, moved to referendum';
    if (proposal.isPassing === ProposalStatus.Passed) return 'Passed';
    if (proposal.isPassing === ProposalStatus.Failed) return 'Motion closed';
    return 'Completed';
  } else if (proposal.completed && proposal instanceof AaveProposal) {
    if (proposal.state === AaveTypes.ProposalState.CANCELED) return 'Cancelled';
    if (proposal.state === AaveTypes.ProposalState.EXECUTED) return 'Executed';
    if (proposal.state === AaveTypes.ProposalState.EXPIRED) return 'Expired';
    if (proposal.state === AaveTypes.ProposalState.FAILED) return 'Did not pass';
  } else if (proposal.completed) {
    if (proposal.isPassing === ProposalStatus.Passed) return 'Passed';
    if (proposal.isPassing === ProposalStatus.Failed) return 'Did not pass';
    return 'Completed';
  }

  const countdown = proposal.endTime.kind === 'fixed'
    ? [ m(Countdown, { duration: moment.duration(proposal.endTime.time.diff(moment())) }), ' left' ]
    : proposal.endTime.kind === 'fixed_block'
      ? [ m(Countdown, { duration: blocknumToDuration(proposal.endTime.blocknum) }), ' left' ]
      : proposal.endTime.kind === 'dynamic'
        ? [ m(Countdown, { duration: blocknumToDuration(proposal.endTime.getBlocknum()) }), ' left' ]
        : proposal.endTime.kind === 'threshold'
          ? `needs ${proposal.endTime.threshold} votes`
          : proposal.endTime.kind === 'not_started'
            ? 'not yet started'
            : proposal.endTime.kind === 'queued'
              ? 'in queue'
              : proposal.endTime.kind === 'unavailable'
                ? '' : '';

  if (proposal instanceof MolochProposal) {
    if (proposal.state === MolochProposalState.NotStarted)
      return 'Waiting to start';
    if (proposal.state === MolochProposalState.GracePeriod)
      return [
        (proposal.isPassing === ProposalStatus.Passed ? 'Passed, ' : 'Failed, '),
        countdown,
        ' in grace period'
      ];
    if (proposal.state === MolochProposalState.InProcessingQueue)
      return 'In processing queue';
    if (proposal.state === MolochProposalState.ReadyToProcess)
      return 'Ready to process';
  }

  if (proposal instanceof AaveProposal) {
    if (proposal.state === AaveTypes.ProposalState.ACTIVE)
      return [ proposal.isPassing === ProposalStatus.Passing ? 'Passing, ' : 'Not passing, ', countdown ];
    if (proposal.state === AaveTypes.ProposalState.PENDING)
      return [ 'Pending, ', countdown ];
    if (proposal.state === AaveTypes.ProposalState.QUEUED)
      return [ 'Queued, ', countdown ];
    if (proposal.state === AaveTypes.ProposalState.SUCCEEDED)
      return 'Ready to queue';
    if (proposal.state === AaveTypes.ProposalState.EXPIRED) return 'Expired';
  }

  if (proposal.isPassing === ProposalStatus.Passed)
    return [ 'Passed, enacting in ', countdown.length === 2 ? countdown[0] : '???' ];
  if (proposal.isPassing === ProposalStatus.Failed)
    return 'Did not pass';
  if (proposal.isPassing === ProposalStatus.Passing && proposal instanceof SubstrateDemocracyProposal)
    return [ 'Expected to pass and move to referendum, ', countdown ];
  if (proposal.isPassing === ProposalStatus.Passing)
    return [ 'Passing, ', countdown ];
  if (proposal.isPassing === ProposalStatus.Failing)
    return [ 'Not passing, ', countdown ];
  return '';
};

// export const getSecondaryStatusText = (proposal: AnyProposal): string | null => {
//   if (proposal instanceof MolochProposal) {
//     if (proposal.state === MolochProposalState.NotStarted) {
//       return 'Waiting for voting to start...';
//     } else if (proposal.state === MolochProposalState.Voting) {
//       return 'Voting Phase.';
//     } else if (proposal.state === MolochProposalState.GracePeriod) {
//       return 'Voting completed. Proposal in grace period.';
//     } else if (proposal.state === MolochProposalState.InProcessingQueue) {
//       return 'Voting completed. Waiting for prior proposals to process.';
//     } else if (proposal.state === MolochProposalState.ReadyToProcess) {
//       return 'Voting completed. Proposal ready for processing.';
//     } else {
//       return null;
//     }
//   } else {
//     return null;
//   }
// };

const ProposalCard: m.Component<{ proposal: AnyProposal, injectedContent? }> = {
  view: (vnode) => {
    const { proposal, injectedContent } = vnode.attrs;
    const { author, createdAt, slug, identifier, title } = proposal;

    return m('.ProposalCard', [
      m('.proposal-card-top', {
        onclick: (e) => {
          e.stopPropagation();
          e.preventDefault();
          localStorage[`${app.activeId()}-proposals-scrollY`] = window.scrollY;
          navigateToSubpage(`/proposal/${proposal.slug}/${proposal.identifier}`
                                   + `-${slugify(proposal.title)}`); // avoid resetting scroll point
        },
      }, [
        m('.proposal-card-metadata', [
          m(Tag, {
            label: [
              chainEntityTypeToProposalShortName(proposalSlugToChainEntityType(proposal.slug)),
              ' ',
              proposal.shortIdentifier,
            ],
            intent: 'primary',
            rounded: true,
            size: 'xs',
          }),
          (proposal instanceof SubstrateDemocracyProposal || proposal instanceof SubstrateCollectiveProposal)
            && proposal.getReferendum()
            && m(Tag, {
              label: `REF #${proposal.getReferendum().identifier}`,
              intent: 'primary',
              rounded: true,
              size: 'xs',
              class: 'proposal-became-tag',
            }),
          proposal instanceof SubstrateDemocracyReferendum
            && (() => {
              const originatingProposalOrMotion = proposal.getProposalOrMotion(proposal.preimage);
              return m(Tag, {
                label: (originatingProposalOrMotion instanceof SubstrateDemocracyProposal)
                  ? `PROP #${originatingProposalOrMotion.identifier}`
                  : (originatingProposalOrMotion instanceof SubstrateCollectiveProposal)
                    ? `MOT #${originatingProposalOrMotion.identifier}` : 'MISSING PROP',
                intent: 'primary',
                rounded: true,
                size: 'xs',
                class: 'proposal-became-tag',
              });
            })(),
          proposal instanceof SubstrateTreasuryProposal && !proposal.data.index && m(Tag, {
            label: 'MISSING DATA',
            intent: 'primary',
            rounded: true,
            size: 'xs',
            class: 'proposal-became-tag',
          }),
          m('.proposal-title', proposal.title),
          proposal instanceof SubstrateTreasuryProposal && m('.proposal-amount', proposal.value?.format(true)),
          proposal instanceof SubstrateDemocracyReferendum && m('.proposal-amount', proposal.threshold),
          proposal instanceof AaveProposal && m('p.card-subheader.proposal-description', proposal.ipfsData?.shortDescription || 'Proposal'),
          // // linked treasury proposals
          // proposal instanceof SubstrateDemocracyReferendum && proposal.preimage?.section === 'treasury'
          //   && proposal.preimage?.method === 'approveProposal'
          //   && m('.proposal-action', [ 'Approves TRES-', proposal.preimage?.args[0] ]),
          // proposal instanceof SubstrateDemocracyProposal && proposal.preimage?.section === 'treasury'
          //   && proposal.preimage?.method === 'approveProposal'
          //   && m('.proposal-action', [ 'Approves TRES-', proposal.preimage?.args[0] ]),
          // proposal instanceof SubstrateCollectiveProposal && proposal.call?.section === 'treasury'
          //   && proposal.call?.method === 'approveProposal'
          //   && m('.proposal-action', [ 'Approves TRES-', proposal.call?.args[0] ]),
          // linked referenda
        ]),
        injectedContent
          ? m('.proposal-injected', [
            m(injectedContent, {
              proposal,
              statusClass: getStatusClass(proposal),
              statusText: getStatusText(proposal, true),
            })
          ])
          : m('.proposal-status', { class: getStatusClass(proposal) }, getStatusText(proposal, true)),
        // thread link
        proposal.threadId && m('.proposal-thread-link', [
          m('a', {
            href: `/${app.activeId()}/proposal/discussion/${proposal.threadId}`,
            onclick: (e) => {
              e.stopPropagation();
              e.preventDefault();
              localStorage[`${app.activeId()}-proposals-scrollY`] = window.scrollY;
              navigateToSubpage(`/proposal/discussion/${proposal.threadId}`);
              // avoid resetting scroll point
            },
          }, [
            m(Icon, { name: Icons.ARROW_UP_RIGHT, size: 'xs' }),
            proposal.threadTitle ? proposal.threadTitle : 'Go to thread'
          ]),
        ])
      ]),
    ]);
  }
};

export default ProposalCard;
