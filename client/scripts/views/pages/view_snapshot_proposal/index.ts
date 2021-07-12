import 'pages/view_proposal/index.scss';
import 'components/proposals/voting_results.scss';
import 'components/proposals/voting_actions.scss';

import m from 'mithril';
import mixpanel from 'mixpanel-browser';
import { Spinner, Button } from 'construct-ui';

import app from 'state';
import Sublayout from 'views/sublayout';
import { AddressInfo, SnapshotProposal } from 'models';
import ConfirmSnapshotVoteModal from 'views/modals/confirm_snapshot_vote_modal';
import { getProposal, getPower } from 'helpers/snapshot_utils/snapshot_utils';

import { notifyError } from 'controllers/app/notifications';
import { ProposalHeaderTitle } from './header';
import {
  ProposalBodyAuthor, ProposalBodyCreated,
  ProposalBodyLastEdited, ProposalBodyText,
} from './body';
import User from '../../components/widgets/user';
import { SocialSharingCarat } from '../../components/social_sharing_carat';

const ProposalHeader: m.Component<{
  snapshotId: string
  proposal: SnapshotProposal
}, {}> = {
  view: (vnode) => {
    const { proposal } = vnode.attrs;
    if (!proposal) {
      return m('.topic-loading-spinner-wrap', [ m(Spinner, { active: true, size: 'lg' }) ]);
    }

    // Original posters have full editorial control, while added collaborators
    // merely have access to the body and title

    const proposalLink = `/${app.activeId()}/snapshot-proposal/${vnode.attrs.snapshotId}/${proposal.ipfsHash}`;

    return m('.ProposalHeader', {
      class: 'proposal-snapshot'
    }, [
      m('.snapshot-proposal-top', [
        m('.proposal-top-left', [
          m('.proposal-title', [
            m(ProposalHeaderTitle, { proposal })
          ]),
          m('.proposal-body-meta', [
            m(ProposalBodyCreated, { item: proposal, link: proposalLink }),
            m(ProposalBodyLastEdited, { item: proposal }),
            m(ProposalBodyAuthor, { item: proposal }),
            m('.CommentSocialHeader', [ m(SocialSharingCarat) ]),
          ]),
        ]),
      ]),
      m('.proposal-content', [
        m('.proposal-content-left', [
          m(ProposalBodyText, { item: proposal })
        ]),
      ]),
    ]);
  }
};

interface Vote {
  voterAddress: string,
  choice: string,
  timestamp: string
}

const VoteRow: m.Component<{
  vote: Vote
}> = {
  view: (vnode) => {
    return m('.ViewRow', [
      m('.row-left', [
        m(User, {
          user: new AddressInfo(null, vnode.attrs.vote.voterAddress, app.activeId(), null), // TODO: activeID becomes chain_base, fix
          linkify: true,
          popover: true
        }),
      ]),
    ]);
  }
};

const VoteView: m.Component<{ votes: Vote[] }> = {
  view: (vnode) => {
    const { votes } = vnode.attrs;

    const voteYesListing = [];
    const voteNoListing = [];

    voteYesListing.push(m('.vote-group-wrap', votes
      .map((vote) => {
        if (vote.choice === 'yes') {
          return m(VoteRow, { vote });
        } else {
          return null;
        }
      })
      .filter((v) => !!v)));

    voteNoListing.push(m('.vote-group-wrap', votes
      .map((vote) => {
        if (vote.choice === 'no') {
          return m(VoteRow, { vote });
        } else {
          return null;
        }
      })
      .filter((v) => !!v)));

    return m('.VotingResults', [
      m('.results-column', [
        m('.results-header', `Voted yes (${votes.filter((v) => v.choice === 'yes').length})`),
        m('.results-cell', [
          voteYesListing
        ]),
      ]),
      m('.results-column', [
        m('.results-header', `Voted no (${votes.filter((v) => v.choice === 'no').length})`),
        m('.results-cell', [
          voteNoListing
        ]),
      ])
    ]);
  }
};

const VoteAction: m.Component<{
  space: any,
  proposal: any,
  id: string,
  totalScore: number,
  scores: any[],
  choices: string[],
}, {
  votingModalOpen: boolean
}> = {
  view: (vnode) => {
    const { choices } = vnode.attrs;
    const canVote = true; // TODO: remove these hardcoded values;
    const hasVotedYes = false;
    const hasVotedNo = false;
    const { votingModalOpen } = vnode.state;

    const onModalClose = () => {
      vnode.state.votingModalOpen = false;
      m.redraw();
    };

    const voteYes = async (event) => {
      event.preventDefault();
      try {
        app.modals.create({
          modal: ConfirmSnapshotVoteModal,
          data: {
            space: vnode.attrs.space,
            proposal: vnode.attrs.proposal,
            id: vnode.attrs.id,
            selectedChoice: 0,
            totalScore: vnode.attrs.totalScore,
            scores: vnode.attrs.scores,
            snapshot: vnode.attrs.proposal.msg.payload.snapshot
          }
        });
        vnode.state.votingModalOpen = true;
      } catch (err) {
        notifyError('Voting failed');
      }
    };

    const voteNo = (event) => {
      event.preventDefault();
      try {
        app.modals.create({
          modal: ConfirmSnapshotVoteModal,
          data: {
            space: vnode.attrs.space,
            proposal: vnode.attrs.proposal,
            id: vnode.attrs.id,
            selectedChoice: 1,
            totalScore: vnode.attrs.totalScore,
            scores: vnode.attrs.scores,
            snapshot: vnode.attrs.proposal.msg.payload.snapshot,
          }
        });
        vnode.state.votingModalOpen = true;
      } catch (err) {
        notifyError('Voting failed');
      }
    };

    const yesButton = m('.yes-button', [
      m(Button, {
        intent: 'positive',
        disabled: !canVote || hasVotedYes || votingModalOpen,
        onclick: voteYes,
        label: hasVotedYes ? `Voted "${choices[0]}"` : `Vote "${choices[0]}"`,
        compact: true,
        rounded: true,
      }),
    ]);
    const noButton = m('.no-button', [
      m(Button, {
        intent: 'negative',
        disabled: !canVote || hasVotedNo || votingModalOpen,
        onclick: voteNo,
        label: hasVotedNo ? `Voted "${choices[1]}"` : `Vote "${choices[1]}"`,
        compact: true,
        rounded: true,
      })
    ]);

    const votingActionObj = [
      m('.button-row', [yesButton, noButton]),
    ];

    return m('.VotingActions', [votingActionObj]);
  }
};

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

        for (const element of votes) {
          const vote: Vote = {
            voterAddress: '',
            choice: '',
            timestamp: '',
          };
          vote.voterAddress = element.voter;
          vote.timestamp = element.created;
          vote.choice = element.choice === 1 ? 'yes' : 'no';
          voteArray.push(vote);
        }
        vnode.state.votes = voteArray;
        const author = app.user.activeAccount;

        if (author && proposal.address) {
          getPower(
            space,
            author.address,
            proposal.msg.payload.snapshot
          ).then((power) => {
            const { scores, totalScore } = power;
            vnode.state.scores = scores;
            vnode.state.totalScore = totalScore;
            m.redraw();
          });
        } else {
          m.redraw();
        }
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
    const author = app.user.activeAccount;

    return m(Sublayout, { class: 'ViewProposalPage', title: 'Snapshot Proposal' }, [
      m(ProposalHeader, {
        snapshotId: vnode.attrs.snapshotId,
        proposal: vnode.state.proposal,
      }),
      m('.PinnedDivider', m('hr')),
      vnode.state.votes && m(VoteView, { votes: vnode.state.votes }),
      vnode.state.proposal && author && m(VoteAction, {
        space: vnode.state.space,
        proposal: vnode.state.snapshotProposal,
        id: vnode.attrs.identifier,
        totalScore: vnode.state.totalScore,
        scores: vnode.state.scores,
        choices: vnode.state.proposal.choices
      })
    ]);
  }
};

export default ViewProposalPage;
