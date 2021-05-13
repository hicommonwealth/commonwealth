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

// Should complete it after mocking up.
const VoteView: m.Component<{
	votes: Vote[]
}> = {
	view: (vnode) => {
		return m('h1', {}, "Votes");
	}
}

const ViewProposalPage: m.Component<{
  identifier: string,
}, {
	proposal: SnapshotProposal
}> = {
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
		const allProposals: SnapshotProposal[] = app.snapshot.proposalStore.getAll(); app.chain.meta.chain.snapshot
		vnode.state.proposal = allProposals.filter(proposal => proposal.ipfsHash === vnode.attrs.identifier)[0];
		let votes: Vote[] = [];

		if (vnode.state.proposal) {
			$.get(`https://hub.snapshot.page/api/${app.chain?.meta.chain.snapshot}/proposal/${vnode.state.proposal.ipfsHash}`).then((response) => {
				if (response.status !== 'Success') {
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
				}
			});
		}

    return m(Sublayout, { class: 'ViewProposalPage', title: "Snapshot Proposal" }, [
      m(ProposalHeader, {
        proposal: vnode.state.proposal,
      }),
			m('.PinnedDivider', m('hr')),
			m(VoteView, {
				votes
			})
    ]);
  }
};

export default ViewProposalPage;
