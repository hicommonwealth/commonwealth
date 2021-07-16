import 'pages/snapshot/view_proposal.scss';
import 'pages/snapshot/list_proposal.scss';

import m from 'mithril';
import mixpanel from 'mixpanel-browser';
import { Spinner, Button, RadioGroup, TabItem, Tabs } from 'construct-ui';

import app from 'state';
import Sublayout from 'views/sublayout';
import { AddressInfo, SnapshotProposal } from 'models';
import ConfirmSnapshotVoteModal from 'views/modals/confirm_snapshot_vote_modal';
import { getProposal, getPower } from 'helpers/snapshot_utils/snapshot_utils';

import { notifyError } from 'controllers/app/notifications';
import moment from 'moment';

import User from '../../components/widgets/user';
import { formatTimestamp } from '../../../helpers';
import MarkdownFormattedText from '../../components/markdown_formatted_text';

const ProposalContent: m.Component<{
  snapshotId: string
  proposal: SnapshotProposal
  votes: Vote[]
  scope: string
  identifier: string
  space:any
  snapshotProposal: any,
  totalScore: number,
  scores: number[],
}, {
  chosenOption:string
  votingModalOpen:boolean
}> = {
  view: (vnode) => {
    const { proposal, votes, snapshotProposal, space, identifier, totalScore, scores } = vnode.attrs;

    const onModalClose = () => {
      vnode.state.votingModalOpen = false;
      m.redraw();
    };

    const handleVote = async (event) => {
      event.preventDefault();
      try {
        app.modals.create({
          modal: ConfirmSnapshotVoteModal,
          data: {
            space,
            proposal,
            id: identifier,
            selectedChoice: vnode.state.chosenOption,
            totalScore,
            scores,
            snapshot: snapshotProposal.snapshot,
          }
        });
        vnode.state.votingModalOpen = true;
      } catch (err) {
        notifyError('Voting failed');
      }
    };

    // Original posters have full editorial control, while added collaborators
    // merely have access to the body and title

    return [
      m('.proposal-title', proposal.name),
      m('.proposal-hash', `#${proposal.ipfsHash}`),
      m('.snapshot-proposals-list', [
        m('.other-details', [
          m('', [
            m('.submitted-by', 'submitted by'),
            m('.author-address', m(User, {
              user: new AddressInfo(null, proposal.authorAddress, app.activeId(), null),
              linkify: true,
              popover: true
            })),
          ]),
          (moment() < moment(+proposal.end * 1000)) ? [
            m('.active-proposal', [
              m('', `Ends in ${formatTimestamp(moment(+proposal.end * 1000))}`),
              m('.active-text', 'Active'),
            ])
          ] : [
            m('.closed-proposal', 'Closed')
          ]
        ]),
      ]),
      m('.ProposalBodyText mt-32', [
        m(MarkdownFormattedText, { doc: proposal.body })
      ]),
      m('.cast-vote', 'Cast your vote'),
      m(RadioGroup, {
        class:'snapshot-votes',
        options: proposal.choices,
        value: vnode.state.chosenOption,
        onchange: (e: Event) => { vnode.state.chosenOption = (e.currentTarget as HTMLInputElement).value; }
      }),
      m(Button, {
        label:'Vote',
        disabled: !vnode.state.chosenOption,
        onclick:handleVote,
      }),
      votes.length > 0 && [
        m('.votes-title', [
          m('.title', 'Votes'),
          m('.vote-count', votes.length)
        ]),
        m('.votes-container', [
          m('.t-head', [
            m('.user-column', 'User'),
            m('.vote-column', 'Vote'),
            m('.power-column', 'Power'),
          ]),
          votes.map((vote) => m('.vote-row', [
            m('.user-column', m(User, {
              user: new AddressInfo(null, vote.voterAddress, app.activeId(), null),
              linkify: true,
              popover: true
            })),
            m('.vote-column', vote.choice),
            m('.power-column', 'Power'),
          ])),
        ]),
      ],
    ];
  }
};

interface Vote {
  voterAddress: string,
  choice: string,
  timestamp: string
}

const ViewProposalPage: m.Component<{
  scope: string,
  snapshotId: string,
  identifier: string,
}, {
  proposal: SnapshotProposal,
  votes: Vote[],
  space: any,
  snapshotProposal: any,
  totalScore: number,
  scores: number[],
  activeTab: string
}> = {
  oninit: (vnode) => {
    vnode.state.votes = [];
    vnode.state.totalScore = 0;
    vnode.state.scores = [];
    vnode.state.activeTab = 'Proposal';

    const snapshotId = vnode.attrs.snapshotId;
    app.snapshot.fetchSnapshotProposals(snapshotId).then((response) => {
      const allProposals: SnapshotProposal[] = app.snapshot.proposalStore.getAll();
      vnode.state.proposal = allProposals.filter((proposal) => proposal.ipfsHash === vnode.attrs.identifier)[0];

      const space = app.snapshot.spaces[vnode.attrs.snapshotId];
      vnode.state.space = space;

      getProposal(vnode.attrs.identifier).then((proposalObj) => {
        const { proposal, votes } = proposalObj;
        vnode.state.snapshotProposal = proposal;
        const voteArray: Vote[] = [];
        const voterAddresses = [];

        for (const element of votes) {
          const vote: Vote = {
            voterAddress: '',
            choice: '',
            timestamp: '',
          };
          voterAddresses.push(element.voter);
          vote.voterAddress = element.voter;
          vote.timestamp = element.created;
          vote.choice = proposal.choices[parseInt(element.choice, 10) - 1];
          voteArray.push(vote);
        }
        vnode.state.votes = voteArray;

        getPower(
          space,
          voterAddresses,
          proposal.snapshot
        ).then((power) => {
          const { scores, totalScore } = power;
          vnode.state.scores = scores;
          vnode.state.totalScore = totalScore;
          m.redraw();
        });
      });
    });
  },

  oncreate: (vnode) => {
    mixpanel.track('PageVisit', { 'Page Name': 'ViewSnapShotProposalPage' });
    mixpanel.track('Proposal Funnel', {
      'Step No': 1,
      'Step': 'Viewing Snapshot Proposal',
      'Snapshot Proposal IpfsHash': `${vnode.attrs.identifier}`,
      'Scope': app.activeId(),
    });
  },

  view: (vnode) => {
    const { proposal, votes, snapshotProposal, totalScore, scores, activeTab } = vnode.state;

    return m(Sublayout, {
      class: 'ViewProposalPage',
      title: 'Snapshot Proposal',
      showNewProposalButton: true,
    }, [
      m('.view-snapshot-proposal-page', [
        snapshotProposal ? [
          // eslint-disable-next-line no-restricted-globals
          m('.back-button', { 'onclick': () => history.back() }, [
            m('img', {
              class: 'back-icon',
              src: '/static/img/arrow-right-black.svg',
              alt: 'Go Back',
            }),
            m('.back-button-text', 'Back')
          ]),
          m(Tabs, {
            align:'left',
            class:'snapshot-tabs'
          }, [
            m(TabItem, {
              label:'Proposal',
              active: activeTab === 'Proposal',
              onclick: () => { vnode.state.activeTab = 'Proposal'; },
            }),
            m(TabItem, {
              label:'Info & Results',
              active: activeTab === 'Info & Results',
              onclick: () => { vnode.state.activeTab = 'Info & Results'; },
            }),
          ]),
          m('.proposal-body', [
            activeTab !== 'Info & Results' && [
              m('.proposal-content', [
                m(ProposalContent, {
                  snapshotId: vnode.attrs.snapshotId,
                  proposal,
                  votes,
                  space:vnode.state.space,
                  scope:vnode.attrs.scope,
                  identifier:vnode.attrs.identifier,
                  snapshotProposal,
                  totalScore,
                  scores,
                }),
              ]),
            ],
            m('.proposal-info', [
              m('.title', 'Information'),
              m('.info-block', [
                m('.labels', [
                  m('', 'Author'),
                  m('', 'IPFS'),
                  m('', 'Voting System'),
                  m('', 'Start Date'),
                  m('', 'End Date'),
                  m('', 'Snapshot'),
                ]),
                m('.values', [
                  m(User, {
                    user: new AddressInfo(null, proposal.authorAddress, app.activeId(), null),
                    linkify: true,
                    popover: true
                  }),
                  m('a', {
                    class:'snapshot-link -mt-10',
                    href: `https://ipfs.fleek.co/ipfs/${proposal.ipfsHash}`,
                    target:'_blank'
                  }, [
                    m('.truncate', `#${proposal.ipfsHash}`),
                    m('img', {
                      class: 'external-link-icon',
                      src: '/static/img/ExternalLink.svg',
                      alt: 'Etherscan link',
                    }),
                  ]),
                  m('.snapshot-type', snapshotProposal.type.split('-').join(' ').concat(' voting')),
                  m('', moment(+proposal.start * 1000).format('lll')),
                  m('', moment(+proposal.end * 1000).format('lll')),
                  m('a', {
                    class:'snapshot-link',
                    href: `https://etherscan.io/block/${snapshotProposal.snapshot}`,
                    target:'_blank'
                  }, [
                    m('.truncate', `#${snapshotProposal.snapshot}`),
                    m('img', {
                      class: 'external-link-icon',
                      src: '/static/img/ExternalLink.svg',
                      alt: 'Etherscan link',
                    }),
                  ]),
                ])
              ]),
              m('.title .mt-72', 'Current Results'),
              proposal.choices.map((choice) => [
                m('.result-choice', choice),
                m('progress', {
                  class:'result-progress',
                  max:'100',
                  value:81.8
                }),
              ]),
            ]),
          ]),
        ] : m('.topic-loading-spinner-wrap', [ m(Spinner, { active: true, size: 'lg' }) ])
      ])
    ]);
  }
};

export default ViewProposalPage;
