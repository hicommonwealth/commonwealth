import 'pages/snapshot/list_proposal.scss';

import m from 'mithril';
import moment from 'moment';
import _ from 'lodash';

import app from 'state';
import { formatTimestamp } from 'helpers';

import { AddressInfo, SnapshotProposal } from 'models';
import { Card } from 'construct-ui';
import User from '../../components/widgets/user';

const ProposalRow: m.Component<{ snapshotId: string, proposal: SnapshotProposal }, { expanded: boolean }> = {
  view: (vnode) => {
    const { proposal } = vnode.attrs;

    if (!proposal) return;
    const proposalLink = `/${app.activeId()}/snapshot-proposal/${vnode.attrs.snapshotId}/${proposal.ipfsHash}`;

    const time = moment(+proposal.end * 1000);
    const now = moment();
    const endTime = `Ends in ${formatTimestamp(moment(+proposal.end * 1000))}`;

    return m(Card, {
      class:'snapshot-proposals-list',
      elevation:1,
      interactive: true,
      onclick: (e) => {
        if (e.metaKey || e.altKey || e.shiftKey || e.ctrlKey) return;
        e.preventDefault();
        localStorage[`${app.activeId()}-proposals-scrollY`] = window.scrollY;
        m.route.set(proposalLink);
      },
    }, [
      m('.title', proposal.name),
      m('.body', proposal.body),
      m('.other-details', [
        m('', [
          m('.submitted-by', 'submitted by'),
          m('.author-address', m(User, {
            user: new AddressInfo(null, proposal.authorAddress, app.activeId(), null),
            linkify: true,
            popover: true
          })),
        ]),
        (now < time) ? [
          m('.active-proposal', [
            m('', endTime),
            m('.active-text', 'Active'),
          ])
        ] : [
          m('.closed-proposal', 'Closed')
        ]
      ]),
    ]);
  }
};

export default ProposalRow;
