import 'pages/view_proposal/index.scss';
import 'components/proposals/voting_results.scss';
import 'components/proposals/voting_actions.scss';

import m from 'mithril';
import mixpanel from 'mixpanel-browser';
import { Spinner, Button } from 'construct-ui';
import moment from 'moment';

import app from 'state';
import Sublayout from 'views/sublayout';
import { AddressInfo } from 'models';
import ConfirmSnapshotVoteModal from 'views/modals/confirm_snapshot_vote_modal';
import { getPower, SnapshotSpace, SnapshotProposal, getVotes, SnapshotProposalVote } from 'helpers/snapshot_utils';

import { notifyError } from 'controllers/app/notifications';
import { ProposalHeaderTitle } from './header';
import {
  ProposalBodyAuthor, ProposalBodyCreated,
  ProposalBodyEnded, ProposalBodyText,
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

    const proposalLink = `/${app.activeId()}/snapshot-proposal/${vnode.attrs.snapshotId}/${proposal.ipfs}`;

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
            m(ProposalBodyEnded, { item: proposal }),
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

const VoteRow: m.Component<{
  vote: SnapshotProposalVote
}> = {
  view: (vnode) => {
    return m('.ViewRow', [
      m('.row-left', [
        m(User, {
          // TODO: activeID becomes chain_base, fix
          user: new AddressInfo(null, vnode.attrs.vote.voter, app.activeId(), null),
          linkify: true,
          popover: true
        }),
      ]),
    ]);
  }
};

// eslint-disable-next-line no-shadow
enum SnapshotVoteChoice {
  YES = 1,
  NO = 2,
}

const VoteView: m.Component<{ votes: SnapshotProposalVote[] }, { numLoadedYes: number, numLoadedNo: number }> = {
  view: (vnode) => {
    const { votes } = vnode.attrs;
    if (!vnode.state.numLoadedYes) { vnode.state.numLoadedYes = 10; }
    if (!vnode.state.numLoadedNo) { vnode.state.numLoadedNo = 10; }

    const voteYesListing = [];
    const voteNoListing = [];

    voteYesListing.push(m('.vote-group-wrap', votes
      .map((vote) => {
        if (vote.choice === SnapshotVoteChoice.YES) {
          return m(VoteRow, { vote });
        } else {
          return null;
        }
      })
      .filter((v) => !!v)
      .slice(0, vnode.state.numLoadedYes)));

    voteNoListing.push(m('.vote-group-wrap', votes
      .map((vote) => {
        if (vote.choice === SnapshotVoteChoice.NO) {
          return m(VoteRow, { vote });
        } else {
          return null;
        }
      })
      .filter((v) => !!v)
      .slice(0, vnode.state.numLoadedNo)));

    return m('.VotingResults', [
      m('.results-column', [
        m('.results-header', `Voted yes (${votes.filter((v) => v.choice === SnapshotVoteChoice.YES).length})`),
        m('.results-cell', [
          voteYesListing
        ]),
        votes.filter((v) => v.choice === SnapshotVoteChoice.YES).length > vnode.state.numLoadedYes ? m(Button, {
          label: 'Load more',
          onclick: () => { vnode.state.numLoadedYes += 10; m.redraw(); },
        }) : null
      ]),
      m('.results-column', [
        m('.results-header', `Voted no (${votes.filter((v) => v.choice === SnapshotVoteChoice.NO).length})`),
        m('.results-cell', [
          voteNoListing
        ]),
        votes.filter((v) => v.choice === SnapshotVoteChoice.NO).length > vnode.state.numLoadedNo ? m(Button, {
          label: 'Load more',
          onclick: () => { vnode.state.numLoadedNo += 10; m.redraw(); },
        }) : null
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
            snapshot: vnode.attrs.proposal.snapshot
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
            snapshot: vnode.attrs.proposal.snapshot,
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
  votes: SnapshotProposalVote[],
  space: SnapshotSpace,
  snapshotProposal: SnapshotProposal,
  totalScore: number,
  scores: number[]
}> = {
  oninit: (vnode) => {
    vnode.state.votes = [];
    vnode.state.totalScore = 0;
    vnode.state.scores = [];
    const getLoadingPage = () => m('.topic-loading-spinner-wrap', [ m(Spinner, { active: true, size: 'lg' }) ]);

    const snapshotId = vnode.attrs.snapshotId;
    if (!app.snapshot.initialized) {
      app.snapshot.init(snapshotId).then(() => m.redraw());
      return getLoadingPage();
    }

    vnode.state.proposal = app.snapshot.proposals.find(
      (proposal) => proposal.ipfs === vnode.attrs.identifier
    );
    // TODO: if proposal not found, throw error

    const space = app.snapshot.space;
    vnode.state.space = space;

    getVotes(vnode.state.proposal.ipfs).then((votes) => {
      vnode.state.votes = votes;
      const author = app.user.activeAccount;

      if (author) {
        getPower(
          space,
          author.address,
          vnode.state.proposal.snapshot
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

    const isActive = vnode.state.proposal
    && moment(+vnode.state.proposal.start * 1000) <= moment()
    && moment(+vnode.state.proposal.end * 1000) > moment();

    return m(Sublayout, { class: 'ViewProposalPage', title: 'Snapshot Proposal' }, [
      m(ProposalHeader, {
        snapshotId: vnode.attrs.snapshotId,
        proposal: vnode.state.proposal,
      }),
      m('.PinnedDivider', m('hr')),
      vnode.state.votes && m(VoteView, { votes: vnode.state.votes }),
      isActive && author && m(VoteAction, {
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
