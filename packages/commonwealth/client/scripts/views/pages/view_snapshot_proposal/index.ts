import m from 'mithril';
import { Button, Tabs, TabItem, RadioGroup } from 'construct-ui';
import moment from 'moment';
import app from 'state';
import { MixpanelSnapshotEvents } from 'analytics/types';
import Sublayout from 'views/sublayout';
import { AddressInfo } from 'models';
import ConfirmSnapshotVoteModal from 'views/modals/confirm_snapshot_vote_modal';
import {
  SnapshotSpace,
  SnapshotProposal,
  SnapshotProposalVote,
  getResults,
  getPower,
} from 'helpers/snapshot_utils';
import { notifyError } from 'controllers/app/notifications';
import { formatPercent, formatNumberLong, formatTimestamp } from 'helpers';
import 'pages/snapshot/list_proposal.scss';
import 'pages/snapshot/view_proposal.scss';
import User from '../../components/widgets/user';
import MarkdownFormattedText from '../../components/markdown_formatted_text';
import { PageLoading } from '../loading';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';
import { ProposalHeaderSnapshotThreadLink } from '../view_proposal/proposal_header_links';
import { mixpanelBrowserTrack } from '../../../helpers/mixpanel_browser_util';
import { isWindowMediumSmallInclusive } from '../../components/component_kit/helpers';
import { PollCard, PollType } from '../../components/component_kit/polls';

const enum VotingError {
  NOT_VALIDATED = 'Insufficient Voting Power',
  ALREADY_VOTED = 'Already Submitted Vote',
}

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
          m('.box-title', 'Votes'),
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
                  user: new AddressInfo(
                    null,
                    vote.voter,
                    app.activeChainId(),
                    null
                  ),
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
    threads: Array<{ id: string; title: string }> | null;
    fetchedPower: boolean;
    validatedAgainstStrategies: boolean;
  }
> = {
  oninit: (vnode) => {
    vnode.state.activeTab = 'Proposals';
    vnode.state.votes = [];
    vnode.state.scores = [];
    vnode.state.proposal = null;
    vnode.state.threads = null;
    vnode.state.fetchedPower = false;
    vnode.state.validatedAgainstStrategies = true;

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

      getPower(
        vnode.state.space,
        vnode.state.proposal,
        app.user?.activeAccount?.address
      ).then((vals) => {
        vnode.state.validatedAgainstStrategies = vals.totalScore > 0;
        vnode.state.totalScore = vals.totalScore;
        vnode.state.fetchedPower = true;
        m.redraw();
      });

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

    const mixpanelTrack = () => {
      mixpanelBrowserTrack({
        event: MixpanelSnapshotEvents.SNAPSHOT_PROPOSAL_VIEWED,
        isCustomDomain: app.isCustomDomain(),
        space: app.snapshot.space.id,
      });
    };

    const snapshotId = vnode.attrs.snapshotId;
    if (!app.snapshot.initialized) {
      app.snapshot.init(snapshotId).then(() => {
        mixpanelTrack();
        loadVotes();
      });
    } else {
      mixpanelTrack();
      loadVotes();
    }

    window.onresize = () => {
      if (
        isWindowMediumSmallInclusive(window.innerWidth) &&
        vnode.state.activeTab !== 'Proposals'
      ) {
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

    const buildVoteInformation = (
      choices,
      snapshotVotes: SnapshotProposalVote[]
    ) => {
      const voteInfo = [];

      for (let i = 0; i < choices.length; i++) {
        const totalVotes = snapshotVotes
          .filter((vote) => vote.choice === i + 1)
          .reduce((sum, vote) => sum + vote.balance, 0);
        voteInfo.push({
          label: choices[i],
          value: choices[i],
          voteCount: totalVotes,
        });
      }

      return voteInfo;
    };

    const castSnapshotVote = async (
      selectedChoice: string,
      callback: () => any
    ) => {
      const choiceNumber =
        vnode.state.proposal?.choices.indexOf(selectedChoice);
      try {
        app.modals.create({
          modal: ConfirmSnapshotVoteModal,
          data: {
            space: vnode.state.space,
            proposal: vnode.state.proposal,
            id: vnode.attrs.identifier,
            selectedChoice: choiceNumber,
            totalScore: vnode.state.totalScore,
            scores: vnode.state.scores,
            snapshot: vnode.state.proposal.snapshot,
            state: vnode.state,
            successCallback: callback,
          },
        });
        // vnode.state.votingModalOpen = true;
      } catch (err) {
        console.error(err);
        notifyError('Voting failed');
      }
    };

    const hasVoted =
      vnode.state.votes.find((vote) => {
        return vote.voter === app.user?.activeAccount?.address;
      })?.choice !== undefined;

    const voteErrorText = !vnode.state.validatedAgainstStrategies
      ? VotingError.NOT_VALIDATED
      : hasVoted
      ? VotingError.ALREADY_VOTED
      : '';

    return !vnode.state.votes || !vnode.state.totals || !vnode.state.proposal
      ? m(PageLoading)
      : m(
          Sublayout,
          {
            title: 'Snapshot Proposal',
          },
          m(
            `.SnapshotViewProposalPage ${
              activeTab === 'Proposals' ? '.proposal-tab' : '.info-tab'
            }`,
            [
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
                    m('.box-title', 'Information'),
                    m('.info-block', [
                      m('.labels', [
                        m('p', 'Author'),
                        m('p', 'IPFS'),
                        m('p', 'Voting System'),
                        m('p', 'Start Date'),
                        m('p', 'End Date'),
                        m(
                          'p',
                          proposal.strategies.length > 1
                            ? 'Strategies'
                            : 'Strategy'
                        ),
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
                            m(CWIcon, {
                              iconName: 'externalLink',
                              iconSize: 'small',
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
                            href: `https://snapshot.org/#/${app.snapshot.space.id}/proposal/${proposal.id}`,
                            target: '_blank',
                          },
                          [
                            m(
                              '.truncate',
                              proposal.strategies.length > 1
                                ? `${proposal.strategies.length} Strategies`
                                : proposal.strategies[0].name
                            ),
                            m(CWIcon, {
                              iconName: 'externalLink',
                              iconSize: 'small',
                            }),
                          ]
                        ),
                        m(
                          'a',
                          {
                            class: 'snapshot-link',
                            href: `https://etherscan.io/block/${proposal.snapshot}`,
                            target: '_blank',
                          },
                          [
                            m('.truncate', `#${proposal.snapshot}`),
                            m(CWIcon, {
                              iconName: 'externalLink',
                              iconSize: 'small',
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
                            thread,
                          })
                        ),
                      ]),
                  ]),
                  m('.poll-card-wrapper', [
                    m(PollCard, {
                      pollType: PollType.Snapshot,
                      multiSelect: false,
                      pollEnded: !isActive,
                      hasVoted,
                      votedFor: '',
                      disableVoteButton:
                        vnode.state.fetchedPower && voteErrorText !== '',
                      proposalTitle: proposal.title,
                      timeRemainingString: voteErrorText, // repurposed for snapshots if we have insufficient power
                      totalVoteCount: vnode.state.totals.sumOfResultsBalance,
                      voteInformation: buildVoteInformation(
                        vnode.state.proposal?.choices,
                        vnode.state.votes
                      ),
                      onVoteCast: (choice: string, callback: () => any) => {
                        castSnapshotVote(choice, callback);
                        m.redraw();
                      },
                      tokenSymbol: vnode.state.symbol,
                      incrementalVoteCast: vnode.state.totalScore,
                    }),
                  ]),
                ]),
              ]),
            ]
          )
        );
  },
};

export default ViewProposalPage;
