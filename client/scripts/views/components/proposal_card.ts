import 'components/proposal_card.scss';

import m from 'mithril';
import moment from 'moment-twitter';
import { Icon, Icons, Tag } from 'construct-ui';

import app from 'state';
import { Coin } from 'adapters/currency';
import { blocknumToDuration, formatLastUpdated, formatPercentShort, slugify, link, pluralize } from 'helpers';
import { ProposalStatus, VotingType, AnyProposal, AddressInfo } from 'models';
import { ProposalType, proposalSlugToChainEntityType, chainEntityTypeToProposalShortName } from 'identifiers';

import Substrate from 'controllers/chain/substrate/main';
import { SubstrateTreasuryProposal } from 'controllers/chain/substrate/treasury_proposal';
import { SubstrateCollectiveProposal } from 'controllers/chain/substrate/collective_proposal';
import SubstrateDemocracyProposal from 'controllers/chain/substrate/democracy_proposal';
import MolochProposal, { MolochProposalState } from 'controllers/chain/ethereum/moloch/proposal';
import MarlinProposal, { MarlinProposalState, MarlinProposalVote } from 'controllers/chain/ethereum/marlin/proposal';

import Countdown from 'views/components/countdown';

export const getStatusClass = (proposal: AnyProposal) => proposal.isPassing === ProposalStatus.Passing ? 'pass'
  : proposal.isPassing === ProposalStatus.Passed ? 'pass'
    : proposal.isPassing === ProposalStatus.Failing ? 'fail'
      : proposal.isPassing === ProposalStatus.Failed ? 'fail' : '';

export const getStatusText = (proposal: AnyProposal, showCountdown: boolean) => {
  if (proposal.completed) {
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
          ? `waiting for ${proposal.endTime.threshold} votes`
          : proposal.endTime.kind === 'not_started'
            ? 'not yet started'
            : proposal.endTime.kind === 'queued'
              ? 'in queue'
              : proposal.endTime.kind === 'unavailable'
                ? '' : '';
  return (proposal instanceof MolochProposal && proposal.state === MolochProposalState.NotStarted)
    ? 'Waiting to start'
    : (proposal instanceof MolochProposal && proposal.state === MolochProposalState.GracePeriod)
      ? [ (proposal.isPassing === ProposalStatus.Passed ? 'Passed, in grace period, ' : 'Failed, in grace period, '),
          countdown ]
      : (proposal instanceof MolochProposal && proposal.state === MolochProposalState.InProcessingQueue)
        ? 'In processing queue'
        : (proposal instanceof MolochProposal && proposal.state === MolochProposalState.ReadyToProcess)
          ? 'Ready to process'
          : proposal.isPassing === ProposalStatus.Passed ? 'Passed, awaiting enactment'
            : proposal.isPassing === ProposalStatus.Failed ? 'Did not pass'
              : proposal.isPassing === ProposalStatus.Passing ? [ 'Passing, ', countdown ]
                : proposal.isPassing === ProposalStatus.Failing ? [ 'Needs more votes, ', countdown ] : '';
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

const ProposalCard: m.Component<{ proposal: AnyProposal }> = {
  view: (vnode) => {
    const { proposal } = vnode.attrs;
    const { author, createdAt, slug, identifier, title } = proposal;
    const proposalLink = `/${app.activeChainId()}/proposal/${proposal.slug}/${proposal.identifier}`
      + `-${slugify(proposal.title)}`;

    return m('.ProposalCard', {
      onclick: (e) => {
        e.stopPropagation();
        e.preventDefault();
        localStorage[`${app.activeId()}-proposals-scrollY`] = window.scrollY;
        m.route.set(proposalLink);
      },
    }, [
      // tag
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
      // title
      m('.proposal-title', proposal.title),
      slug === ProposalType.SubstrateTreasuryProposal
        && m('.proposal-amount', (proposal as SubstrateTreasuryProposal).value.format(true)),
      m('.proposal-comments', pluralize(app.comments.nComments(proposal), 'comment')),
      m('.proposal-status', { class: getStatusClass(proposal) }, getStatusText(proposal, true)),
    ]);
  }
};

export default ProposalCard;
