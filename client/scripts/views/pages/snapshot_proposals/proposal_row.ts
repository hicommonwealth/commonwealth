import 'pages/discussions/discussion_row.scss';

import m from 'mithril';
import moment from 'moment';
import _ from 'lodash';

import app from 'state';
import { formatLastUpdated, link } from 'helpers';

import { SnapshotProposal } from 'models';
import ProposalListingRow from 'views/components/proposal_listing_row';

const ProposalRow: m.Component<{ proposal: SnapshotProposal }, { expanded: boolean }> = {
  view: (vnode) => {
    const { proposal } = vnode.attrs;

    if (!proposal) return;
    const proposalLink = `/${app.activeId()}/snapshot-proposal/${proposal.ipfsHash}`;

    const time = moment(+proposal.end * 1000);
    const now = moment();
    const rowHeader: any = [
      link('a', proposalLink, proposal.name),
    ];
    const rowSubheader = [
      proposal.ipfsHash && link('a.proposal-topic', proposalLink, [
        m('span.proposal-topic-name', `${proposal.ipfsHash}`),
      ]),
      m('.created-at', link('a', proposalLink, (now > time) ? `Ended ${formatLastUpdated(time)}` 
        : `Ending ${formatLastUpdated(moment(+proposal.end * 1000))}`)),
    ];

    return m(ProposalListingRow, {
      class: 'DiscussionRow',
      contentLeft: {
        header: rowHeader,
        subheader: rowSubheader,
      },
      onclick: (e) => {
        if (e.metaKey || e.altKey || e.shiftKey || e.ctrlKey) return;
        e.preventDefault();
        localStorage[`${app.activeId()}-proposals-scrollY`] = window.scrollY;
        m.route.set(proposalLink);
      },
    });
  }
};

export default ProposalRow;
