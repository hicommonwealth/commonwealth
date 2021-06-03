import 'pages/view_proposal/index.scss';
import 'components/proposals/voting_results.scss';
import 'components/proposals/voting_actions.scss';

import $ from 'jquery';
import m from 'mithril';
import mixpanel from 'mixpanel-browser';
import { Spinner, Button } from 'construct-ui';

import app from 'state';
import Sublayout from 'views/sublayout';
import {SnapshotProposal } from 'models';

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
    };

    const voteNo = (e) => {
      e.preventDefault();
      vnode.state.votingModalOpen = false;
      // open modal and check canVote and create vote
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
}> = {
  oninit: (vnode) => {
    vnode.state.votes = [];

    const snapshotId = vnode.attrs.snapshotId;
    app.snapshot.fetchSnapshotProposals(snapshotId).then(response => {
      
      const allProposals: SnapshotProposal[] = app.snapshot.proposalStore.getAll();
      vnode.state.proposal = allProposals.filter(proposal => proposal.ipfsHash === vnode.attrs.identifier)[0];

      if (vnode.state.proposal) {
        const hubUrl = process.env.SNAPSHOT_APP_HUB_URL || 'https://testnet.snapshot.org';
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
    return m(Sublayout, { class: 'ViewProposalPage', title: "Snapshot Proposal" }, [
      m(ProposalHeader, {
        snapshotId: vnode.attrs.snapshotId,
        proposal: vnode.state.proposal,
      }),
      m('.PinnedDivider', m('hr')),
      vnode.state.votes && m(VoteView, { votes: vnode.state.votes }),
      vnode.state.proposal && m(VoteAction, { choices: vnode.state.proposal.choices})
    ]);
  }
};

export default ViewProposalPage;
