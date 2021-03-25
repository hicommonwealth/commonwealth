import 'components/proposal_row.scss';

import m from 'mithril';
import moment from 'moment-twitter';

import app from 'state';
import { Coin } from 'adapters/currency';
import { blocknumToDuration, formatLastUpdated, formatPercentShort, slugify, link } from 'helpers';
import { ProposalStatus, VotingType, AnyProposal, AddressInfo } from 'models';

import Countdown from 'views/components/countdown';
import Substrate from 'controllers/chain/substrate/main';
import User from 'views/components/widgets/user';
import { ProposalType, proposalSlugToFriendlyName } from 'identifiers';
import { SubstrateTreasuryProposal } from 'client/scripts/controllers/chain/substrate/treasury_proposal';
import { SubstrateCollectiveProposal } from 'client/scripts/controllers/chain/substrate/collective_proposal';
import SubstrateDemocracyProposal from 'client/scripts/controllers/chain/substrate/democracy_proposal';
import MolochProposal, { MolochProposalState } from 'controllers/chain/ethereum/moloch/proposal';
import MarlinProposal, { MarlinProposalState, MarlinProposalVote } from 'controllers/chain/ethereum/marlin/proposal';

import { Icon, Icons, Grid, Col } from 'construct-ui';
import ListingRow from './listing_row';
import UserGallery from './widgets/user_gallery';

export const formatProposalHashShort = (pHash : string) => {
  if (!pHash) return;
  if (pHash.length < 16) return pHash;
  return `${pHash.slice(0, 16)}…${pHash.slice(pHash.length - 3)}`;
};

export const getStatusClass = (proposal: AnyProposal) => proposal.isPassing === ProposalStatus.Passing ? 'pass'
  : proposal.isPassing === ProposalStatus.Passed ? 'pass'
    : proposal.isPassing === ProposalStatus.Failing ? 'fail'
      : proposal.isPassing === ProposalStatus.Failed ? 'fail' : '';

export const getProposalId = (proposal: AnyProposal) => {
  return `${proposalSlugToFriendlyName.get(proposal.slug)} ${proposal.shortIdentifier}`;
};

export const getStatusText = (proposal: AnyProposal, showCountdown: boolean) => {
  if (proposal.completed) return 'Completed';

  const countdown = proposal.endTime.kind === 'fixed'
    ? [ m(Countdown, { duration: moment.duration(proposal.endTime.time.diff(moment())) }), ' left' ]
    : proposal.endTime.kind === 'fixed_block'
      ? [ m(Countdown, { duration: blocknumToDuration(proposal.endTime.blocknum) }), ' left' ]
      : proposal.endTime.kind === 'dynamic'
        ? [ m(Countdown, { duration: blocknumToDuration(proposal.endTime.getBlocknum()) }), ' left' ]
        : proposal.endTime.kind === 'threshold'
          ? `Waiting for ${proposal.endTime.threshold} yes votes`
          : proposal.endTime.kind === 'not_started'
            ? 'Not yet started'
            : proposal.endTime.kind === 'queued'
              ? 'Queued'
              : proposal.endTime.kind === 'unavailable'
                ? '' : '';
  const status = proposal instanceof MolochProposal && proposal.state === MolochProposalState.NotStarted
    ? 'Waiting to start'
    : proposal instanceof MolochProposal && proposal.state === MolochProposalState.GracePeriod
      ? (proposal.isPassing === ProposalStatus.Passed ? 'Passed · In grace period' : 'Failed · In grace period')
      : proposal instanceof MolochProposal && proposal.state === MolochProposalState.InProcessingQueue
        ? 'In processing queue'
        : proposal instanceof MolochProposal && proposal.state === MolochProposalState.ReadyToProcess
          ? 'Ready to process'
          : proposal.isPassing === ProposalStatus.Passed ? 'Awaiting enactment'
            : proposal.isPassing === ProposalStatus.Failed ? 'Did not pass'
              : proposal.isPassing === ProposalStatus.Passing ? 'Passing'
                : proposal.isPassing === ProposalStatus.Failing ? 'Needs more votes' : '';
  if (proposal.isPassing === ProposalStatus.Passing
      || proposal.isPassing === ProposalStatus.Failing
      || (proposal instanceof MolochProposal
        && (proposal as MolochProposal).state === MolochProposalState.GracePeriod)) {
    return [ countdown, ` · ${status}` ];
  } else {
    return status;
  }
};

export const getSecondaryStatusText = (proposal: AnyProposal): string | null => {
  if (proposal instanceof MolochProposal) {
    if (proposal.state === MolochProposalState.NotStarted) {
      return 'Waiting for voting to start...';
    } else if (proposal.state === MolochProposalState.Voting) {
      return 'Voting Phase.';
    } else if (proposal.state === MolochProposalState.GracePeriod) {
      return 'Voting completed. Proposal in grace period.';
    } else if (proposal.state === MolochProposalState.InProcessingQueue) {
      return 'Voting completed. Waiting for prior proposals to process.';
    } else if (proposal.state === MolochProposalState.ReadyToProcess) {
      return 'Voting completed. Proposal ready for processing.';
    } else {
      return null;
    }
  } else {
    return null;
  }
};

const ProposalRow: m.Component<{ proposal: AnyProposal }> = {
  view: (vnode) => {
    const proposal = vnode.attrs.proposal;
    const { author, createdAt, slug, identifier, title } = proposal;
    const nComments = app.comments.nComments(proposal);

    // TODO XXX: Show requirement for referenda
    const hasRequirement = false;
    const requirementText = '';
    const requirementExplanation = '';
    let statusClass;
    let statusText;
    try {
      statusClass = getStatusClass(proposal);
      statusText = getStatusText(proposal, true);
    } catch (e) {
      statusClass = '';
      statusText = 'Loading...';
    }

    const proposalLink = `/${app.activeChainId()}/proposal/${proposal.slug}/${proposal.identifier}`
      + `-${slugify(proposal.title)}`;

    const rowHeader = link('a', proposalLink, proposal.title);

    const rowSubheader = (
      slug !== ProposalType.SubstrateTreasuryProposal
      && slug !== ProposalType.SubstrateDemocracyProposal
      && slug !== ProposalType.SubstrateCollectiveProposal)
      ? m('.proposal-row-metadata', [
        m('span.proposal-id', getProposalId(proposal)),
        !!statusText && m('span.metadata-divider', ' · '),
        !!statusText && m('span.proposal-status', { class: statusClass }, statusText),
      ])
      : (slug === ProposalType.SubstrateDemocracyProposal)
        ?  m('.proposal-row-metadata', [
          m('span.proposal-id', getProposalId(proposal)),
          !!statusText && m('span.metadata-divider', ' · '),
          !!statusText && m('span.proposal-status', { class: statusClass }, statusText),
          m('span.metadata-divider', ' · '),
          m('span.proposal-votes', `${(proposal as SubstrateDemocracyProposal).getVoters().length} votes`),
        ])
        : (slug === ProposalType.SubstrateCollectiveProposal)
          ? m('.proposal-row-metadata', [
            m('span.proposal-id', getProposalId(proposal)),
            !!statusText && m('span.metadata-divider', ' · '),
            !!statusText && m('span.proposal-status', { class: statusClass }, statusText),
          ])
          : null;

    const rowMetadata = [
      m(UserGallery, {
        popover: true,
        avatarSize: 24,
        users: app.comments.uniqueCommenters(proposal)
      }),
      !proposal.completed
        ? m('.last-updated', 'Active')
        : createdAt && createdAt instanceof moment
          ? m('.last-updated', formatLastUpdated(proposal.createdAt))
          : null
    ];

    const regularProposal = (slug !== ProposalType.SubstrateTreasuryProposal)
      ? m(ListingRow, {
        class: 'ProposalRow',
        contentLeft: {
          header: rowHeader,
          subheader: rowSubheader,
        },
        contentRight: rowMetadata,
        rightColSpacing: [6, 6],
        onclick: (e) => {
          e.stopPropagation();
          e.preventDefault();
          localStorage[`${app.activeId()}-proposals-scrollY`] = window.scrollY;
          m.route.set(proposalLink);
        },
      })
      : null;

    const treasuryProposal = (slug === ProposalType.SubstrateTreasuryProposal)
      ? m('.TreasuryRow', {
        onclick: (e) => {
          e.stopPropagation();
          e.preventDefault();
          localStorage[`${app.activeId()}-proposals-scrollY`] = window.scrollY;
          m.route.set(proposalLink);
        },
      }, [
        m('.treasury-row-title', proposal.title),
        m(Grid, [
          m(Col, { span: 3 }, [
            m('.treasury-row-subheading', 'Value'),
            m('.treasury-row-metadata', (proposal as SubstrateTreasuryProposal).value.format(true)),
          ]),
          m(Col, { span: 3 }, [
            m('.treasury-row-subheading', 'Bond'),
            m('.treasury-row-metadata', (proposal as SubstrateTreasuryProposal).bond.format(true))
          ]),
          m(Col, { span: 3 }, [
            m('.treasury-row-subheading', 'Author'),
            m('.treasury-row-metadata .treasury-user', [
              m(User, {
                user: new AddressInfo(
                  null,
                  (proposal as SubstrateTreasuryProposal).beneficiaryAddress,
                  app.chain.id,
                  null
                ),
                hideAvatar: true,
                popover: true,
              }),
            ]),
            m('.treasury-row-metadata .treasury-user-mobile', [
              m(User, {
                user: new AddressInfo(
                  null,
                  (proposal as SubstrateTreasuryProposal).beneficiaryAddress,
                  app.chain.id,
                  null
                ),
                hideAvatar: true,
                popover: true,
              }),
            ]),
          ])
        ])
      ])
      : null;

    return regularProposal || treasuryProposal;
  }
};

export default ProposalRow;
