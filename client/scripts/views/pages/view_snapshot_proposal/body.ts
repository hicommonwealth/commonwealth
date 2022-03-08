import 'pages/view_proposal/editor_permissions.scss';

import m from 'mithril';

import { formatLastUpdated, formatTimestamp } from 'helpers';
import { AddressInfo } from 'models';

import MarkdownFormattedText from 'views/components/markdown_formatted_text';
import User from 'views/components/widgets/user';
import { SnapshotProposal } from 'helpers/snapshot_utils';
import moment from 'moment';
import app from 'state';

export const ProposalBodyAuthor: m.Component<{ item: SnapshotProposal }> = {
  view: (vnode) => {
    const { item } = vnode.attrs;
    if (!item) return;
    if (!item.author) return;

    return m('.ProposalBodyAuthor', [
      m(User, {
        user: new AddressInfo(null, item.author, app.activeChainId(), null), // TODO: activeID becomes chain_base, fix
        linkify: true,
        popover: true,
      }),
    ]);
  },
};

export const ProposalBodyCreated: m.Component<{
  item: SnapshotProposal;
  link: string;
}> = {
  view: (vnode) => {
    const { item, link } = vnode.attrs;
    if (!item) return;
    if (!item.created) return;
    const time = moment(+item.start * 1000);

    return m('.ProposalBodyCreated', [
      m('', `Created ${formatLastUpdated(time)}`),
    ]);
  },
};

export const ProposalBodyEnded: m.Component<{ item: SnapshotProposal }> = {
  view: (vnode) => {
    const { item } = vnode.attrs;
    if (!item) return;
    if (!item.end) {
      return;
    }

    const now = moment();
    const time = moment(+item.end * 1000);

    return m('.ProposalBodyLastEnded', [
      m(
        '',
        now > time
          ? `Ended ${formatLastUpdated(time)}`
          : `Ending in ${formatTimestamp(time)}`
      ),
    ]);
  },
};

export const ProposalBodyText: m.Component<{ item: SnapshotProposal }> = {
  view: (vnode) => {
    const { item } = vnode.attrs;
    if (!item) return;

    const body = item.body;
    if (!body) return;

    return m('.ProposalBodyText', [m(MarkdownFormattedText, { doc: body })]);
  },
};
