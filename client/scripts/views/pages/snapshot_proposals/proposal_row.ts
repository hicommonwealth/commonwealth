import 'pages/discussions/discussion_row.scss';

import m from 'mithril';
import moment from 'moment';
import _ from 'lodash';

import app from 'state';
import { formatLastUpdated, formatTimestamp, link } from 'helpers';

import ProposalListingRow from 'views/components/proposal_listing_row';
import { SnapshotProposal } from 'helpers/snapshot_utils';

const ProposalRow: m.Component<{ snapshotId: string, proposal: SnapshotProposal }, { expanded: boolean }> = {
  view: (vnode) => {
    const { proposal } = vnode.attrs;

    if (!proposal) return;
    const proposalLink = `/${app.activeId()}/snapshot-proposal/${vnode.attrs.snapshotId}/${proposal.ipfs}`;

    const time = moment(+proposal.end * 1000);
    const now = moment();
    const rowHeader: any = [
      link('a', proposalLink, proposal.title),
    ];
    const rowSubheader = [
      m('.created-at', link('a', proposalLink, (now > time)
        ? `Ended ${formatLastUpdated(time)}`
        : `Ending in ${formatTimestamp(moment(+proposal.end * 1000))}`)),
      m('span.m-l-20', ' · '),
      proposal.ipfs && link('a.proposal-topic.m-l-20', proposalLink, [
        m('span.proposal-topic-name', `${proposal.ipfs}`),
      ]),
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
