import 'pages/snapshot/view_proposal.scss';
import 'pages/snapshot/list_proposal.scss';

import m from 'mithril';
import {
  Spinner,
  Button,
  Tabs,
  TabItem,
  Icon,
  Icons,
  RadioGroup,
} from 'construct-ui';
import moment from 'moment';
import app from 'state';
import Sublayout from 'views/sublayout';
import { AddressInfo } from 'models';
import ConfirmSnapshotVoteModal from 'views/modals/confirm_snapshot_vote_modal';
import {
  SnapshotSpace,
  SnapshotProposal,
  SnapshotProposalVote,
  getResults,
} from 'helpers/snapshot_utils';
import { notifyError } from 'controllers/app/notifications';
import { formatPercent, formatNumberLong, formatTimestamp } from 'helpers';

import { ProposalHeaderSnapshotThreadLink } from '../view_proposal/header';
import User from '../../components/widgets/user';
import MarkdownFormattedText from '../../components/markdown_formatted_text';

const ProposalContent: m.Component<
  {
    proposal: SnapshotProposal;
    votes: SnapshotProposalVote[];
    symbol: string;
  },
  {
    votersListExpanded: boolean;
  }
> = {
  oncreate: (vnode) => {
    vnode.state.votersListExpanded = false;
  },
  view: (vnode) => {
    const { proposal, votes, symbol } = vnode.attrs;

    const votersList = vnode.state.votersListExpanded
      ? votes
      : votes.slice(0, 10);

    return [
      m('.snapshot-proposal-title', proposal.title),
      m('.snapshot-proposal-hash', `#${proposal.ipfs}`),
      m('.snapshot-proposals-list', [
        m('.other-details', [
          m('div', [
            m('.submitted-by', 'submitted by'),
            m('.author-address', [
              m(User, {
                user: new AddressInfo(
                  null,
                  proposal.author,
                  app.activeChainId(),
                  null
                ),
                linkify: true,
                popover: true,
              }),
            ]),
          ]),
          proposal.state === 'active'
            ? [
                m('.active-proposal', [
                  m(
                    'span',
                    `Ends in ${formatTimestamp(moment(+proposal.end * 1000))}`
                  ),
                  m('.active-text', 'Active'),
                ]),
              ]
            : [m('.closed-proposal', proposal.state)],
        ]),
      ]),
      m('.ProposalBodyText', [
        m(MarkdownFormattedText, { doc: proposal.body }),
      ]),
      votes.length > 0 && [
        m('.votes-title', [
          m('.title', 'Votes'),
          m('.vote-count', votes.length),
        ]),
        m('.votes-container', [
          m('.t-head', [
            m('.user-column', 'User'),
            m('.vote-column', 'Vote'),
            m('.power-column', 'Power'),
          ]),
          votersList.map((vote) =>
            m('.vote-row', [
              m('.user-column', [
                m(User, {
                  user: new AddressInfo(null, vote.voter, app.activeChainId(), null),
                  linkify: true,
                  popover: true,
                }),
              ]),
              m('.vote-column', proposal.choices[vote.choice - 1]),
              m('.power-column', `${formatNumberLong(vote.balance)} ${symbol}`),
            ])
          ),
          m(
            'button',
            {
              class: 'view-more-button',
              onclick: () => {
                vnode.state.votersListExpanded = true;
                m.redraw();
              },
            },
            'VIEW MORE'
          ),
        ]),
      ],
    ];
  },
};

const VotingResults: m.Component<
  {
    votes: SnapshotProposalVote[];
    choices: string[];
    totals: any;
    symbol: string;
  },
  {
    voteCounts: number[];
    voteListings: any[];
  }
> = {
  view: (vnode) => {
    const { choices, totals, symbol } = vnode.attrs;
    if (!choices.length) return;

    vnode.state.voteListings = choices.map((choice, idx) => {
      const totalForChoice = totals.resultsByVoteBalance[idx];
      const voteFrac =
        totals.sumOfResultsBalance !== 0
          ? totalForChoice / totals.sumOfResultsBalance
          : 0;

      return [
        m('.result-choice', choice),
        m('.result-choice-details', [
          m('.vote-balance-for-choice', [
            m(
              'span',
              { class: 'font-medium' },
              formatNumberLong(totalForChoice)
            ),
            m('span', { class: 'symbol' }, symbol),
          ]),
          m('span', { class: 'font-medium' }, formatPercent(voteFrac, 2)),
        ]),
        m('progress', {
          class: 'result-progress',
          max: '100',
          value: voteFrac * 100,
        }),
      ];
    });

    return [vnode.state.voteListings];
  },
};

const VoteAction: m.Component<
  {
    space: SnapshotSpace;
    proposal: SnapshotProposal;
    id: string;
    totalScore: number;
    scores: number[];
    choices: string[];
    votes: SnapshotProposalVote[];
  },
  {
    votingModalOpen: boolean;
    chosenOption: string;
  }
> = {
  view: (vnode) => {
    const { proposal } = vnode.attrs;
    const hasVoted = vnode.attrs.votes.find((vote) => {
      return vote.voter === app.user?.activeAccount?.address;
    })?.choice;

    const onModalClose = () => {
      vnode.state.votingModalOpen = false;
      m.redraw();
    };

    const vote = async (selectedChoice: number) => {
      try {
        app.modals.create({
          modal: ConfirmSnapshotVoteModal,
          data: {
            space: vnode.attrs.space,
            proposal: vnode.attrs.proposal,
            id: vnode.attrs.id,
            selectedChoice,
            totalScore: vnode.attrs.totalScore,
            scores: vnode.attrs.scores,
            snapshot: vnode.attrs.proposal.snapshot,
            state: vnode.state,
          },
        });
        vnode.state.votingModalOpen = true;
      } catch (err) {
        console.error(err);
        notifyError('Voting failed');
      }
    };

    if (!vnode.attrs.proposal.choices?.length) return;

    return m('.VoteAction', [
      m('.title', 'Cast your vote'),
      m(RadioGroup, {
        class: 'snapshot-votes',
        options: proposal.choices,
        value:
          (hasVoted && proposal.choices[hasVoted]) || vnode.state.chosenOption,
        onchange: (e: Event) => {
          vnode.state.chosenOption = (
            e.currentTarget as HTMLInputElement
          ).value;
        },
      }),
      m(Button, {
        label: 'Vote',
        disabled: hasVoted !== undefined || !vnode.state.chosenOption,
        onclick: () => vote(proposal.choices.indexOf(vnode.state.chosenOption)),
      }),
    ]);
  },
};

const ViewProposalPage: m.Component<
  {
    scope: string;
    snapshotId: string;
    identifier: string;
  },
  {
    proposal: SnapshotProposal;
    votes: SnapshotProposalVote[];
    space: SnapshotSpace;
    totals: any;
    symbol: string;
    snapshotProposal: SnapshotProposal;
    totalScore: number;
    scores: number[];
    activeTab: string;
    threads: Array<{id: string, title: string}> | null;
  }
> = {
  oninit: (vnode) => {
    vnode.state.activeTab = 'Proposals';
    vnode.state.votes = [];
    vnode.state.totalScore = 0;
    vnode.state.scores = [];
    vnode.state.proposal = null;
    vnode.state.threads = null;

    const loadVotes = async () => {
      vnode.state.proposal = app.snapshot.proposals.find(
        (proposal) => proposal.id === vnode.attrs.identifier
      );

      const space = app.snapshot.space;
      vnode.state.space = space;
      vnode.state.symbol = space.symbol;

      await getResults(space, vnode.state.proposal).then((res) => {
        vnode.state.votes = res.votes;
        vnode.state.totals = res.results;
      });
      m.redraw();

      try {
        app.threads
        .fetchThreadIdsForSnapshot({ snapshot: vnode.state.proposal.id })
        .then((res) => {
          vnode.state.threads = res;
          m.redraw();
        });
      } catch (e) {
        console.error(`Failed to fetch threads: ${e}`);
      }
    };

    const snapshotId = vnode.attrs.snapshotId;
    if (!app.snapshot.initialized) {
      app.snapshot.init(snapshotId).then(() => {
        loadVotes();
      });
    } else {
      loadVotes();
    }

    window.onresize = () => {
      if (window.innerWidth > 1024 && vnode.state.activeTab !== 'Proposals') {
        vnode.state.activeTab = 'Proposals';
        m.redraw();
      }
    };
  },
  view: (vnode) => {
    const author = app.user.activeAccount;
    const { proposal, votes, activeTab, threads } = vnode.state;
    const route = m.route.get();
    const scope = route.slice(0, route.lastIndexOf('/'));

    const isActive =
      vnode.state.proposal &&
      moment(+vnode.state.proposal.start * 1000) <= moment() &&
      moment(+vnode.state.proposal.end * 1000) > moment();

    return m(
      Sublayout,
      {
        class: `SnapshotViewProposalPage ${
          activeTab === 'Proposals' ? 'proposal-tab' : 'info-tab'
        }`,
        title: 'Snapshot Proposal',
      },
      !vnode.state.votes || !vnode.state.totals || !vnode.state.proposal
        ? m(Spinner, { fill: true, active: true, size: 'xl' })
        : [
            // eslint-disable-next-line no-restricted-globals
            m('.back-button', { onclick: () => m.route.set(scope) }, [
              m('img', {
                class: 'back-icon',
                src: '/static/img/arrow-right-black.svg',
                alt: 'Go Back',
              }),
              m('.back-button-text', 'Back'),
            ]),
            m(
              Tabs,
              {
                align: 'left',
                class: 'snapshot-tabs',
              },
              [
                m(TabItem, {
                  label: 'Proposals',
                  active: activeTab === 'Proposals',
                  onclick: () => {
                    vnode.state.activeTab = 'Proposals';
                  },
                }),
                m(TabItem, {
                  label: 'Info & Results',
                  active: activeTab === 'Info & Results',
                  onclick: () => {
                    vnode.state.activeTab = 'Info & Results';
                  },
                }),
              ]
            ),
            m('.proposal-body', [
              activeTab !== 'Info & Results' && [
                m('.proposal-content', [
                  m(ProposalContent, {
                    proposal,
                    votes,
                    symbol: vnode.state.symbol,
                  }),
                ]),
              ],
              m('.proposal-info', [
                m('.proposal-info-box', [
                  m('.title', 'Information'),
                  m('.info-block', [
                    m('.labels', [
                      m('p', 'Author'),
                      m('p', 'IPFS'),
                      m('p', 'Voting System'),
                      m('p', 'Start Date'),
                      m('p', 'End Date'),
                      m('p', 'Snapshot'),
                    ]),
                    m('.values', [
                      m(User, {
                        user: new AddressInfo(
                          null,
                          proposal.author,
                          app.activeChainId(),
                          null
                        ),
                        linkify: true,
                        popover: true,
                      }),
                      m(
                        'a',
                        {
                          class: 'snapshot-link -mt-10',
                          href: `https://ipfs.fleek.co/ipfs/${proposal.ipfs}`,
                          target: '_blank',
                        },
                        [
                          m('.truncate', `#${proposal.ipfs}`),
                          m(Icon, {
                            name: Icons.EXTERNAL_LINK,
                            class: 'external-link-icon',
                          }),
                        ]
                      ),
                      m(
                        '.snapshot-type',
                        proposal.type.split('-').join(' ').concat(' voting')
                      ),
                      m('p', moment(+proposal.start * 1000).format('lll')),
                      m('p', moment(+proposal.end * 1000).format('lll')),
                      m(
                        'a',
                        {
                          class: 'snapshot-link',
                          href: `https://etherscan.io/block/${proposal.snapshot}`,
                          target: '_blank',
                        },
                        [
                          m('.truncate', `#${proposal.snapshot}`),
                          m(Icon, {
                            name: Icons.EXTERNAL_LINK,
                            class: 'external-link-icon',
                          }),
                        ]
                      ),
                    ]),
                  ]),
                  threads !== null &&
                    m('.linked-discussion', [
                      m('.heading-2', 'Linked Discussions'),
                      threads.map((thread) => 
                        m(ProposalHeaderSnapshotThreadLink, {
                          thread
                        }),
                      )
                    ]),
                ]),
                isActive &&
                  author &&
                  m(VoteAction, {
                    space: vnode.state.space,
                    proposal: vnode.state.proposal,
                    id: vnode.attrs.identifier,
                    totalScore: vnode.state.totalScore,
                    scores: vnode.state.scores,
                    choices: vnode.state.proposal.choices,
                    votes: vnode.state.votes,
                  }),
                m('.proposal-info-box', [
                  m('.title', 'Current Results'),
                  m(VotingResults, {
                    choices: vnode.state.proposal.choices,
                    votes: vnode.state.votes,
                    totals: vnode.state.totals,
                    symbol: vnode.state.symbol,
                  }),
                ]),
              ]),
            ]),
          ]
    );
  },
};

export default ViewProposalPage;
