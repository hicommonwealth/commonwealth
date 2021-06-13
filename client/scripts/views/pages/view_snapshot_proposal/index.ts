import 'pages/view_proposal/index.scss';
import 'components/proposals/voting_results.scss';
import 'components/proposals/voting_actions.scss';

import $ from 'jquery';
import m from 'mithril';
import mixpanel from 'mixpanel-browser';
import { Spinner, Button } from 'construct-ui';
import getProvider from '@snapshot-labs/snapshot.js/src/utils/provider';

import app from 'state';
import Sublayout from 'views/sublayout';
import { SnapshotProposal } from 'models';
import ConfirmSnapshotVoteModal from 'views/modals/confirm_snapshot_vote_modal';
import snapshotClient from 'helpers/snapshot_utils/snapshot_client';
import { formatSpace, getProposal, getPower } from 'helpers/snapshot_utils/snapshot_utils';

import { ProposalHeaderTitle } from './header';
import {
  ProposalBodyAuthor, ProposalBodyCreated,
  ProposalBodyLastEdited, ProposalBodyText,
} from './body';

const ProposalHeader: m.Component<{
  snapshotId: string
  proposal: SnapshotProposal
}, {}> = {
  view: (vnode) => {
    const { proposal } = vnode.attrs;
    if (!proposal) {
      return m('.topic-loading-spinner-wrap', [ m(Spinner, { active: true, size: 'lg' }) ])
    }

    // Original posters have full editorial control, while added collaborators
    // merely have access to the body and title
		
    const proposalLink = `/${app.activeId()}/snapshot-proposal/${vnode.attrs.snapshotId}/${proposal.ipfsHash}`;

    return m('.ProposalHeader', {
      class: `proposal-snapshot`
    }, [
      m('.proposal-top', [
        m('.proposal-top-left', [
          m('.proposal-title', [
            m(ProposalHeaderTitle, { proposal })
          ]),
          m('.proposal-body-meta', [
            m(ProposalBodyCreated, { item: proposal, link: proposalLink }),
	          m(ProposalBodyLastEdited, { item: proposal }),
	          m(ProposalBodyAuthor, { item: proposal })
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
      m('.row-left', vnode.attrs.vote.voterAddress),
      // m('.row-right', vnode.attrs.vote.choice)
    ]);
  }
}

const VoteView: m.Component<{ votes: Vote[] }> = {
  view: (vnode) => {
    const { votes } = vnode.attrs;

    let voteYesListing = [];
    let voteNoListing = [];

    voteYesListing.push(m('.vote-group-wrap', votes
      .map((vote) => {
        if (vote.choice === 'yes'){
          return m(VoteRow, { vote });
        }
      })
    ));

    voteNoListing.push(m('.vote-group-wrap', votes
      .map((vote) => {
        if (vote.choice === 'no'){
          return m(VoteRow, { vote });
        }
      })
    ));

    // TODO: fix up this function for cosmos votes
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
  // space: any, 
	// proposal: any,
	// id: number,
	// selectedChoice: number,
	// totalScore: number,
	// scores: any[],
	// snapshot: number
  choices: string[],
}, {
  votingModalOpen: boolean
}> = {
  view: (vnode) => {
    let { choices } = vnode.attrs;
    let canVote = true;
    let hasVotedYes = false;
    let hasVotedNo = false;
    const { votingModalOpen } = vnode.state;

    const onModalClose = () => {
      vnode.state.votingModalOpen = false;
      m.redraw();
    };

    const voteYes = async (e) => {
      e.preventDefault();
      vnode.state.votingModalOpen = false;
      console.log('here');
      app.modals.create({ modal: ConfirmSnapshotVoteModal, data: {

      } });
    };

    const voteNo = (e) => {
      e.preventDefault();
      vnode.state.votingModalOpen = false;
      app.modals.create({ modal: ConfirmSnapshotVoteModal, data: {

      } });
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

    let votingActionObj;
    votingActionObj = [
      m('.button-row', [yesButton, noButton]),
    ];

    return m('.VotingActions', [votingActionObj]);
  }
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
  totalScore: number
}> = {
  oninit: (vnode) => {
    vnode.state.votes = [];
    vnode.state.totalScore = 0;

    const snapshotId = vnode.attrs.snapshotId;
    app.snapshot.fetchSnapshotProposals(snapshotId).then(response => {
      
      const allProposals: SnapshotProposal[] = app.snapshot.proposalStore.getAll();
      vnode.state.proposal = allProposals.filter(proposal => proposal.ipfsHash === vnode.attrs.identifier)[0];

      snapshotClient.getSpaces().then(response => {
        let spaces: any = Object.fromEntries(
          Object.entries(response).map(space => [
            space[0],
            formatSpace(space[0], space[1])
          ])
        );
        let space = spaces[vnode.attrs.snapshotId];
        vnode.state.space = space;

        
        getProposal(space, vnode.attrs.identifier).then(proposalObj => {
          const { proposal, votes, blockNumber } = proposalObj;
          console.log(proposal, votes, blockNumber);
          vnode.state.snapshotProposal = proposal;
        })

        const author = app.user.activeAccount;

        if (author && this.proposal.address) {
          getPower(
            space,
            author.address,
            vnode.state.snapshotProposal.msg.payload.snapshot
          ).then(power => {
            const { scores, totalScore } = power;
            console.log(power);
            // this.totalScore = totalScore;
            // this.scores = scores;
          });
        }
        

        m.redraw();
        // getScores(
        //   space.key,
        //   space.strategies,
        //   space.network,
        //   getProvider(space.network),
        //   [app.user.activeAccount.address]
        // ).then(response => {
        //   console.log(response)
        //   let scores = response
        //     .map(score => Object.values(score).reduce((a, b) => (a as number) + (b as number), 0))
        //     .reduce((a, b) => (a as number) + (b as number), 0);
        //   vnode.state.userScore = scores as number;
        //   vnode.state.space = space;
        //   m.redraw();
        // });
      });

      if (vnode.state.proposal) {
        const hubUrl = process.env.SNAPSHOT_HUB_URL || 'https://testnet.snapshot.org';
        $.get(`${hubUrl}/api/${snapshotId}/proposal/${vnode.state.proposal.ipfsHash}`).then((response) => {
          if (response.status !== 'Success') {
            var i = 0;
            let votes: Vote[] = [];
            for (const key in response) {
              let vote: Vote = {
                voterAddress: '',
                choice: '',
                timestamp: '',
              };
              vote.voterAddress = key,
              vote.timestamp = response[key].msg.timestamp;
              vote.choice = response[key].msg.payload.choice === 1 ? 'yes' : 'no';
              votes.push(vote);
            }
            vnode.state.votes = votes;
            m.redraw();
          }
        });
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

    return m(Sublayout, { class: 'ViewProposalPage', title: "Snapshot Proposal" }, [
      m(ProposalHeader, {
        snapshotId: vnode.attrs.snapshotId,
        proposal: vnode.state.proposal,
      }),
      m('.PinnedDivider', m('hr')),
      vnode.state.votes && m(VoteView, { votes: vnode.state.votes }),
      vnode.state.proposal && author && m(VoteAction, { choices: vnode.state.proposal.choices})
    ]);
  }
};

export default ViewProposalPage;
