import 'pages/snapshot/view_proposal.scss';
import 'pages/snapshot/list_proposal.scss';

import m from 'mithril';
import mixpanel from 'mixpanel-browser';
import { Spinner, Button, RadioGroup } from 'construct-ui';

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
}, {}> = {
  view: (vnode) => {
    const { proposal, votes } = vnode.attrs;

    // Original posters have full editorial control, while added collaborators
    // merely have access to the body and title

    return [
      // eslint-disable-next-line no-restricted-globals
      m('.back-button', { 'onclick': () => history.back() }, [
        m('img', {
          class: 'back-icon',
          src: '/static/img/arrow-right-black.svg',
          alt: 'Go Back',
        }),
        m('.back-button-text', 'Back')
      ]),
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
        // onchange: (e: Event) => this.selected = (e.currentTarget as HTMLInputElement).value
      }),
      m(Button, {
        label:'Vote',
        disabled: true,
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
            // m('.power-column', 'Power'),
          ]),
          votes.map((vote) => m('.vote-row', [
            m('.user-column', m(User, {
              user: new AddressInfo(null, vote.voterAddress, app.activeId(), null),
              linkify: true,
              popover: true
            })),
            m('.vote-column', vote.choice),
            // m('.power-column', vote.timestamp),
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

// const VoteRow: m.Component<{
//   vote: Vote
// }> = {
//   view: (vnode) => {
//     return m('.ViewRow', [
//       m('.row-left', [
//         m(User, {
//           user: new AddressInfo(null, vnode.attrs.vote.voterAddress, app.activeId(), null), // TODO: activeID becomes chain_base, fix
//           linkify: true,
//           popover: true
//         }),
//       ]),
//     ]);
//   }
// };

// const VoteView: m.Component<{ votes: Vote[] }> = {
//   view: (vnode) => {
//     const { votes } = vnode.attrs;

//     const voteYesListing = [];
//     const voteNoListing = [];

//     voteYesListing.push(m('.vote-group-wrap', votes
//       .map((vote) => {
//         if (vote.choice === 'yes') {
//           return m(VoteRow, { vote });
//         } else {
//           return null;
//         }
//       })
//       .filter((v) => !!v)));

//     voteNoListing.push(m('.vote-group-wrap', votes
//       .map((vote) => {
//         if (vote.choice === 'no') {
//           return m(VoteRow, { vote });
//         } else {
//           return null;
//         }
//       })
//       .filter((v) => !!v)));

//     return m('.VotingResults', [
//       m('.results-column', [
//         m('.results-header', `Voted yes (${votes.filter((v) => v.choice === 'yes').length})`),
//         m('.results-cell', [
//           voteYesListing
//         ]),
//       ]),
//       m('.results-column', [
//         m('.results-header', `Voted no (${votes.filter((v) => v.choice === 'no').length})`),
//         m('.results-cell', [
//           voteNoListing
//         ]),
//       ])
//     ]);
//   }
// };

// const VoteAction: m.Component<{
//   space: any,
//   proposal: any,
//   id: string,
//   totalScore: number,
//   scores: any[],
//   choices: string[],
// }, {
//   votingModalOpen: boolean
// }> = {
//   view: (vnode) => {
//     const { choices } = vnode.attrs;
//     const canVote = true; // TODO: remove these hardcoded values;
//     const hasVotedYes = false;
//     const hasVotedNo = false;
//     const { votingModalOpen } = vnode.state;

//     const onModalClose = () => {
//       vnode.state.votingModalOpen = false;
//       m.redraw();
//     };

//     const voteYes = async (event) => {
//       event.preventDefault();
//       try {
//         app.modals.create({
//           modal: ConfirmSnapshotVoteModal,
//           data: {
//             space: vnode.attrs.space,
//             proposal: vnode.attrs.proposal,
//             id: vnode.attrs.id,
//             selectedChoice: 0,
//             totalScore: vnode.attrs.totalScore,
//             scores: vnode.attrs.scores,
//             snapshot: vnode.attrs.proposal.msg.payload.snapshot
//           }
//         });
//         vnode.state.votingModalOpen = true;
//       } catch (err) {
//         notifyError('Voting failed');
//       }
//     };

//     const voteNo = (event) => {
//       event.preventDefault();
//       try {
//         app.modals.create({
//           modal: ConfirmSnapshotVoteModal,
//           data: {
//             space: vnode.attrs.space,
//             proposal: vnode.attrs.proposal,
//             id: vnode.attrs.id,
//             selectedChoice: 1,
//             totalScore: vnode.attrs.totalScore,
//             scores: vnode.attrs.scores,
//             snapshot: vnode.attrs.proposal.msg.payload.snapshot,
//           }
//         });
//         vnode.state.votingModalOpen = true;
//       } catch (err) {
//         notifyError('Voting failed');
//       }
//     };

//     const yesButton = m('.yes-button', [
//       m(Button, {
//         intent: 'positive',
//         disabled: !canVote || hasVotedYes || votingModalOpen,
//         onclick: voteYes,
//         label: hasVotedYes ? `Voted "${choices[0]}"` : `Vote "${choices[0]}"`,
//         compact: true,
//         rounded: true,
//       }),
//     ]);
//     const noButton = m('.no-button', [
//       m(Button, {
//         intent: 'negative',
//         disabled: !canVote || hasVotedNo || votingModalOpen,
//         onclick: voteNo,
//         label: hasVotedNo ? `Voted "${choices[1]}"` : `Vote "${choices[1]}"`,
//         compact: true,
//         rounded: true,
//       })
//     ]);

//     const votingActionObj = [
//       m('.button-row', [yesButton, noButton]),
//     ];

//     return m('.VotingActions', [votingActionObj]);
//   }
// };

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
  scores: number[]
}> = {
  oninit: (vnode) => {
    vnode.state.votes = [];
    vnode.state.totalScore = 0;
    vnode.state.scores = [];

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
    const { proposal, votes, snapshotProposal, scores } = vnode.state;

    return m(Sublayout, {
      class: 'ViewProposalPage',
      title: 'Snapshot Proposal',
      showNewProposalButton: true,
    }, [
      m('.view-snapshot-proposal-page', [
        snapshotProposal ? [
          m('.proposal-content', [
            m(ProposalContent, {
              snapshotId: vnode.attrs.snapshotId,
              proposal,
              votes,
            }),
          ]),
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
        ] : m('.topic-loading-spinner-wrap', [ m(Spinner, { active: true, size: 'lg' }) ])
      ])
    ]);
  }
};

export default ViewProposalPage;
