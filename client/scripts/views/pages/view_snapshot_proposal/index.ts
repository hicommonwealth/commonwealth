import 'pages/view_proposal/index.scss';
import 'components/proposals/voting_results.scss';
import 'components/proposals/voting_actions.scss';

import m from 'mithril';
import mixpanel from 'mixpanel-browser';
import { Spinner, Button } from 'construct-ui';
import moment from 'moment';

import app from 'state';
import Sublayout from 'views/sublayout';
import { AddressInfo, OffchainThread } from 'models';
import ConfirmSnapshotVoteModal from 'views/modals/confirm_snapshot_vote_modal';
import { getPower, SnapshotSpace, SnapshotProposal, getVotes, SnapshotProposalVote } from 'helpers/snapshot_utils';

import { notifyError } from 'controllers/app/notifications';
import { ProposalHeaderTitle } from './header';
import {
  ProposalBodyAuthor, ProposalBodyCreated,
  ProposalBodyEnded, ProposalBodyText,
} from './body';
import { ProposalHeaderSnapshotThreadLink } from '../view_proposal/header';
import User from '../../components/widgets/user';
import { SocialSharingCarat } from '../../components/social_sharing_carat';

const ProposalHeader: m.Component<{
  snapshotId: string
  proposal: SnapshotProposal
}, {
  loaded: boolean, 
  thread: OffchainThread
}> = {
  view: (vnode) => {
    const { proposal } = vnode.attrs;
    if (!proposal) {
      return m('.topic-loading-spinner-wrap', [ m(Spinner, { active: true, size: 'lg' }) ]);
    }

    // Original posters have full editorial control, while added collaborators
    // merely have access to the body and title

    const proposalLink = `/${app.activeId()}/snapshot-proposal/${vnode.attrs.snapshotId}/${proposal.ipfs}`;

    if (!vnode.state.loaded) {
      try {
        app.threads.fetchThreadForSnapshot({snapshot: proposal.id}).then((res) => { 
          vnode.state.loaded = true;
          vnode.state.thread = res;
        })
        m.redraw();
      } catch (err) {
        console.log(err);
      }
    }

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
          m('.proposal-body-link', [
            vnode.state.loaded && m(ProposalHeaderSnapshotThreadLink, { thread: vnode.state.thread })
          ]),
          m('br')
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

const VoteView: m.Component<{
  votes: SnapshotProposalVote[],
  choices: string[],
}, {
  voteCounts: number[],
  voteListings: any[],
}> = {
  view: (vnode) => {
    const { votes, choices } = vnode.attrs;
    if (!choices.length) return;
    if (!vnode.state.voteCounts?.length) {
      vnode.state.voteCounts = choices.map((choice, idx) => 10);
    }

    vnode.state.voteListings = choices.map((choice, idx) => {
      const votesForChoice = votes.filter((v) => v.choice === idx + 1);
      return m('.results-column', [
        m('.results-header', `Voted for ${choice} (${votesForChoice.length})`),
        m('.results-cell', [
          m('.vote-group-wrap', votesForChoice
            .map((vote) => m(VoteRow, { vote }))
            .filter((v) => !!v)
            .slice(0, vnode.state.voteCounts[idx])),
        ]),
        votesForChoice.length > vnode.state.voteCounts[idx]
          ? m(Button, {
            label: 'Load more',
            onclick: () => { vnode.state.voteCounts[idx] += 10; m.redraw(); },
          })
          : null
      ]);
    });

    return m('.VotingResults', vnode.state.voteListings);
  }
};

const VoteAction: m.Component<{
  space: SnapshotSpace,
  proposal: SnapshotProposal,
  id: string,
  totalScore: number,
  scores: number[],
  choices: string[],
  votes: any[],
}, {
  votingModalOpen: boolean
}> = {
  view: (vnode) => {
    const { choices } = vnode.attrs;
    const canVote = true; // TODO: remove these hardcoded values;
    const hasVoted = vnode.attrs.votes.find((vote) => {
      return (vote.voter === app.user?.activeAccount?.address);
    })?.choice;
    const { votingModalOpen } = vnode.state;

    const onModalClose = () => {
      vnode.state.votingModalOpen = false;
      m.redraw();
    };

    const vote = async (selectedChoice: number) => {
      console.log(`vnode.attrs.proposal ${vnode.attrs.proposal}`);
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
            state: vnode.state
          }
        });
        vnode.state.votingModalOpen = true;
      } catch (err) {
        console.log(err);
        notifyError('Voting failed');
      }
    };

    if (!vnode.attrs.proposal.choices?.length) return;
    const votingButtons = vnode.attrs.proposal.choices.map((choice, idx) => {
      const choiceNum = idx + 1;
      return m(`.voting-option.option-${choiceNum}`, [
        m(Button, {
          disabled: !canVote || hasVoted === choiceNum || votingModalOpen,
          onclick: (e) => vote(idx),
          label: hasVoted === choiceNum ? `Voted "${choices[idx]}"` : `Vote "${choices[idx]}"`,
          compact: true,
          rounded: true,
        }),
      ]);
    });

    const votingActionObj = [
      m('.button-row', votingButtons),
    ];

    return m('.VotingActions.Snapshot', [votingActionObj]);
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
    const loadVotes = async () => {
      vnode.state.proposal = app.snapshot.proposals.find(
        (proposal) => proposal.ipfs === vnode.attrs.identifier
      );
      // TODO: if proposal not found, throw error

      const space = app.snapshot.space;
      vnode.state.space = space;

      const votes = await getVotes(vnode.state.proposal.ipfs);
      vnode.state.votes = votes;
      const author = app.user.activeAccount;

      if (author) {
        try {
          const power = await getPower(
            space,
            author.address,
            vnode.state.proposal.snapshot
          );
          const { scores, totalScore } = power;
          vnode.state.scores = scores;
          vnode.state.totalScore = totalScore;
        } catch (e) {
          console.error(`Could not fetch scores: ${e.message}`);
        }
      }

      m.redraw();
    };

    const snapshotId = vnode.attrs.snapshotId;
    if (!app.snapshot.initialized) {
      app.snapshot.init(snapshotId).then(() => {
        loadVotes();
      });
    } else {
      loadVotes();
    }
  },
  view: (vnode) => {
    const getLoadingPage = () => m('.topic-loading-spinner-wrap', [ m(Spinner, { active: true, size: 'lg' }) ]);
    if (!vnode.state.votes) {
      return getLoadingPage();
    }

    const author = app.user.activeAccount;

    const isActive = vnode.state.proposal
    && moment(+vnode.state.proposal.start * 1000) <= moment()
    && moment(+vnode.state.proposal.end * 1000) > moment();

    return m(Sublayout, { 
      class: 'ViewProposalPage', 
      title: 'Snapshot Proposal',
    }, [
      m(ProposalHeader, {
        snapshotId: vnode.attrs.snapshotId,
        proposal: vnode.state.proposal,
      }),
      m('.PinnedDivider', m('hr')),
      vnode.state.votes
      && vnode.state.proposal
      && m(VoteView, {
        choices: vnode.state.proposal.choices,
        votes: vnode.state.votes
      }),
      isActive
      && author
      && m(VoteAction, {
        space: vnode.state.space,
        proposal: vnode.state.proposal,
        id: vnode.attrs.identifier,
        totalScore: vnode.state.totalScore,
        scores: vnode.state.scores,
        choices: vnode.state.proposal.choices,
        votes: vnode.state.votes,
      })
    ]);
  }
};

export default ViewProposalPage;
