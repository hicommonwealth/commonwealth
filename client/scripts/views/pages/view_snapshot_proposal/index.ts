import 'pages/view_proposal/index.scss';

import $ from 'jquery';
import m from 'mithril';
import mixpanel from 'mixpanel-browser';

import app from 'state';
import Sublayout from 'views/sublayout';
import {SnapshotProposal } from 'models';

import { ProposalHeaderTitle } from './header';
import {
  ProposalBodyAuthor, ProposalBodyCreated,
  ProposalBodyLastEdited, ProposalBodyText,
} from './body';

const ProposalHeader: m.Component<{
  proposal: SnapshotProposal
}, {}> = {
  view: (vnode) => {
    const { proposal } = vnode.attrs;

    // Original posters have full editorial control, while added collaborators
    // merely have access to the body and title
		
    const proposalLink = `/${app.activeId()}/snapshot-proposal/${proposal.ipfsHash}`;

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
      m('.row-right', vnode.attrs.vote.choice)
    ]);
  }
}

// Should complete it after mocking up.
const VoteView: m.Component<{
  votes: Vote[],
  voteCount: number
}, {}> = {
  view: (vnode) => {
    const { votes, voteCount } = vnode.attrs;
    let voteListing = [];

    voteListing.push(m('.vote-group-wrap', votes
      .map((vote) => m(VoteRow, { vote }))));

    return m('.VoteView', [
      m('h1', [
        'Votes',
        m('.vote-count', `${voteCount}`)
      ]),
      voteListing
    ]);
  }
}

const ViewProposalPage: m.Component<{
  identifier: string,
}, {
  proposal: SnapshotProposal,
  votes: Vote[],
  voteCount: number
}> = {
  oninit: (vnode) => {
    vnode.state.votes = [];
    vnode.state.voteCount = 0;

    const allProposals: SnapshotProposal[] = app.snapshot.proposalStore.getAll();
    vnode.state.proposal = allProposals.filter(proposal => proposal.ipfsHash === vnode.attrs.identifier)[0];

    if (vnode.state.proposal) {
      $.get(`https://hub.snapshot.page/api/${app.chain?.meta.chain.snapshot}/proposal/${vnode.state.proposal.ipfsHash}`).then((response) => {
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
            vote.choice = vnode.state.proposal.choices[response[key].msg.payload.choice - 1];
            votes.push(vote);
          }
          vnode.state.voteCount = votes.length;
          vnode.state.votes = votes.slice(0, 40);
          m.redraw();
        }
      });
    }
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
        proposal: vnode.state.proposal,
      }),
      m('.PinnedDivider', m('hr')),
      m(VoteView, { votes: vnode.state.votes, voteCount: vnode.state.voteCount })
    ]);
  }
};

export default ViewProposalPage;
