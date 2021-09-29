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
import { SnapshotSpace, SnapshotProposal, SnapshotProposalVote, getResults } from 'helpers/snapshot_utils';

import { notifyError } from 'controllers/app/notifications';
import { ProposalHeaderTitle } from './header';
import {
  ProposalBodyAuthor, ProposalBodyCreated,
  ProposalBodyEnded, ProposalBodyText,
} from './body';
import { ProposalHeaderExternalSnapshotLink, ProposalHeaderSnapshotThreadLink } from '../view_proposal/header';
import User from '../../components/widgets/user';
import { SocialSharingCarat } from '../../components/social_sharing_carat';
import { formatPercent, formatNumberLong } from 'helpers';

const ProposalHeader: m.Component<{
  snapshotId: string
  proposal: SnapshotProposal
}, {
  loaded: boolean, 
  thread: string,
}> = {
  view: (vnode) => {
    const { proposal, snapshotId } = vnode.attrs;
    if (!proposal) return;

    // Original posters have full editorial control, while added collaborators
    // merely have access to the body and title

    const proposalLink = `/${app.activeId()}/snapshot/${snapshotId}/${proposal.ipfs}`;

    if (!vnode.state.loaded) {
      try {
        vnode.state.loaded = true;
        app.threads.fetchThreadIdForSnapshot({snapshot: proposal.id}).then((res) => { 
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
            (vnode.state.thread !== 'false') && vnode.state.loaded && m(ProposalHeaderSnapshotThreadLink, { threadId: vnode.state.thread }),
            vnode.state.loaded && m(ProposalHeaderExternalSnapshotLink, { proposal: proposal, spaceId: snapshotId }),
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
  symbol: string
}> = {
  view: (vnode) => {
    const { vote, symbol } = vnode.attrs;
    return m('.VoteRow', [
      m('.row-left', [
        m(User, {
          // TODO: activeID becomes chain_base, fix
          user: new AddressInfo(null, vnode.attrs.vote.voter, app.activeId(), null),
          linkify: true,
          popover: true
        }),
      ]),
      m('.row-right', `${formatNumberLong(vote.power)} ${symbol}`)
    ]);
  }
};

const VotingResults: m.Component<{
  votes: SnapshotProposalVote[],
  choices: string[],
  totals: any,
  symbol: string,
}, {
  voteCounts: number[],
  voteListings: any[],
}> = {
  view: (vnode) => {
    const { votes, choices, totals, symbol } = vnode.attrs;
    if (!choices.length) return;
    if (!vnode.state.voteCounts?.length) {
      vnode.state.voteCounts = choices.map((choice, idx) => 10);
    }

    vnode.state.voteListings = choices.map((choice, idx) => {
      const votesForChoice = votes.filter((v) => v.choice === idx + 1);
      const totalForChoice = totals.resultsByVoteBalance[idx];
      const voteFrac = totalForChoice / totals.sumOfResultsBalance;
      return m('.results-column', [
        m('.results-header', `Voted for ${choice}: ${formatNumberLong(totalForChoice)} ${symbol} (${formatPercent(voteFrac, 4)}) (${votesForChoice.length} voters)`),
        m('.results-cell', [
          m('.vote-group-wrap', votesForChoice
            .map((vote) => m(VoteRow, { vote, symbol }))
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
  totals: any,
  symbol: string,
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
      // const await getResults()

      const space = app.snapshot.space;
      vnode.state.space = space;
      vnode.state.symbol = space.symbol;

      await getResults(space, vnode.state.proposal).then((res) => {
        vnode.state.votes = res.votes;
        vnode.state.totals = res.results;
        console.log(vnode.state.totals);
      });      

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
    const author = app.user.activeAccount;

    const isActive = vnode.state.proposal
    && moment(+vnode.state.proposal.start * 1000) <= moment()
    && moment(+vnode.state.proposal.end * 1000) > moment();

    return m(Sublayout, { 
      class: 'ViewProposalPage', 
      title: 'Snapshot Proposal',
    }, (!vnode.state.votes && !vnode.state.totals) ? m(Spinner, { active: true }) : [
      m(ProposalHeader, {
        snapshotId: vnode.attrs.snapshotId,
        proposal: vnode.state.proposal,
      }),
      m('.PinnedDivider', m('hr')),
      vnode.state.totals && vnode.state.votes
      && vnode.state.proposal
      && m(VotingResults, {
        choices: vnode.state.proposal.choices,
        votes: vnode.state.votes,
        totals: vnode.state.totals,
        symbol: vnode.state.symbol,
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
