import 'components/proposal_row.scss';

import m from 'mithril';
import Chart from 'chart.js';
import moment from 'moment-twitter';

import app from 'state';
import { Coin } from 'adapters/currency';
import {
  formatLastUpdated,
  slugify,
  formatPercentShort,
  blocknumToDuration,
  byAscendingCreationDate,
  link
} from 'helpers';
import { ProposalStatus, VotingType, AnyProposal, AddressInfo } from 'models';

import QuillFormattedText from 'views/components/quill_formatted_text';
import MarkdownFormattedText from 'views/components/markdown_formatted_text';
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
import ReactionButton, { ReactionType } from './reaction_button';
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
          : proposal.isPassing === ProposalStatus.Passed ? 'Passed'
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

export const getSupportText = (proposal: AnyProposal) => {
  if (typeof proposal.support === 'number') {
    return `${formatPercentShort(proposal.support)} voted yes`;
  } else if (proposal.support instanceof Coin && proposal.votingType === VotingType.SimpleYesNoVoting) {
    return `${proposal.support.format()} voted yes`;
  } else if (proposal.support instanceof Coin && proposal.votingType === VotingType.ConvictionYesNoVoting) {
    return `${proposal.support.format()} voted yes`;
  } else if (proposal.support instanceof Coin && proposal.votingType === VotingType.SimpleYesApprovalVoting) {
    return `${proposal.support.format()} locked`;
  } else if (proposal.support instanceof Coin && proposal.votingType === VotingType.RankedChoiceVoting) {
    return `${proposal.support.format()} voted`;
  } else if (proposal.support instanceof Coin && proposal.votingType === VotingType.None) {
    return '';
  } else {
    return '';
  }
};

interface IPieChartAttrs {
  id?: string;
  getData: () => {
    chartValues: number[];
    chartLabels: string[];
    chartColors: string[];
    formatter: (d: number, index) => string[];
  };
}

interface IPieChartState {
  chart: Chart;
}

const ProposalPieChart: m.Component<IPieChartAttrs, IPieChartState> = {
  view: (vnode: m.VnodeDOM<IPieChartAttrs, IPieChartState>) => {
    if (!vnode.attrs.getData || !vnode.attrs.id) return;
    return m('.proposal-pie-chart', [
      m('canvas', {
        id: vnode.attrs.id,
        oncreate: (canvas) => {
          const { chartValues, chartLabels, chartColors, formatter } = vnode.attrs.getData();
          const data = {
            datasets: [{
              data: chartValues,
              backgroundColor: chartColors,
              borderWidth: 0,
              formatter,
            }],
            labels: chartLabels
          };
          // tslint:disable-next-line:no-string-literal
          const ctx = canvas.dom['getContext']('2d');
          vnode.state.chart = new Chart(ctx, {
            type: 'doughnut',
            data,
            options: {
              aspectRatio: 1,
              cutoutPercentage: 67,
              animation: { duration: 0 },
              responsive: true,
              legend: false,
              title: false,
              layout: { left: 0, right: 0, top: 0, bottom: 0 },
              tooltips: {
                callbacks: {
                  label: (tooltipItem, data2) => {
                    const dataset = data2.datasets[tooltipItem.datasetIndex];
                    const item = dataset.data[tooltipItem.index];
                    return dataset.formatter ? dataset.formatter(item, tooltipItem.index) : item.toString();
                  }
                }
              }
            }
          });
        }
      })
    ]);
  }
};

export const getProposalPieChart = (proposal) => typeof proposal.support === 'number'
  ? m(ProposalPieChart, {
    id: `CHART_${proposal.shortIdentifier}`,
    getData: () => ({
      chartValues: [ proposal.support, 1 - proposal.support ].reverse(),
      chartLabels: [ 'Yes', 'No' ].reverse(),
      chartColors: [ '#1db955', '#d0021b' ].reverse(),
      formatter: (d, index) => [formatPercentShort(d)],
    })
  })
  : m(ProposalPieChart, {
    id: `CHART_${proposal.shortIdentifier}`,
    getData: () => ({
      chartValues: [
        // add a small amount so the voted slice always shows up
        proposal.support.inDollars / (app.chain as Substrate).chain.totalbalance.inDollars + 0.004,
        ((app.chain as Substrate).chain.totalbalance.inDollars - proposal.support.inDollars)
            / (app.chain as Substrate).chain.totalbalance.inDollars + 0.004,
      ].reverse(),
      chartLabels: [ 'Voted', 'Not yet voted' ].reverse(),
      chartColors: [ '#0088cc', '#dddddd' ].reverse(),
      formatter: (d, index) => [ `${Math.round((d - 0.004) * 10000000) / 100000}%` ],
    })
  });

interface IRowAttrs {
  proposal: AnyProposal;
}

const ProposalRow: m.Component<IRowAttrs> = {
  view: (vnode) => {
    const proposal = vnode.attrs.proposal;
    const { author, createdAt, slug, identifier, title } = proposal;
    const nComments = app.comments.nComments(proposal);
    const firstComment = app.comments.getByProposal(proposal).sort(byAscendingCreationDate)[0];

    // TODO XXX: Show requirement for referenda
    const hasRequirement = false;
    const requirementText = '';
    const requirementExplanation = '';
    let statusClass;
    let statusText;
    let supportText;
    try {
      statusClass = getStatusClass(proposal);
      statusText = getStatusText(proposal, true);
      supportText = getSupportText(proposal);
    } catch (e) {
      statusClass = '';
      statusText = 'Loading...';
      supportText = null;
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

    const rowComments = m('.proposal-row-comments', !firstComment ? [
      'No comments yet'
    ] : [
      m(User, {
        hideIdentityIcon: true,
        user: new AddressInfo(null, firstComment.author, firstComment.authorChain, null)
      }),
      ':',
      (() => {
        try {
          const doc = JSON.parse(firstComment.text);
          if (!doc.ops) throw new Error();
          return m(QuillFormattedText, { doc, collapse: true, hideFormatting: true });
        } catch (e) {
          return m(MarkdownFormattedText, { doc: firstComment.text, collapse: true, hideFormatting: true });
        }
      })(),
    ]);

    const rowMetadata = [
      m(UserGallery, {
        popover: true,
        avatarSize: 24,
        users: app.comments.uniqueCommenters(proposal)
      }),
      m(ReactionButton, {
        post: proposal,
        type: ReactionType.Like,
        tooltip: true
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
          subheader: m('.proposal-row-sub', [rowSubheader, rowComments]),
        },
        contentRight: rowMetadata,
        rightColSpacing: [4, 4, 4],
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
