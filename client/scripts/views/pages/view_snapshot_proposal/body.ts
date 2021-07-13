import 'pages/view_proposal/editor_permissions.scss';

import m from 'mithril';

import { updateRoute } from 'app';
import { formatLastUpdated } from 'helpers';
import { AddressInfo, SnapshotProposal } from 'models';

import MarkdownFormattedText from 'views/components/markdown_formatted_text';
import moment from 'moment';
import app from 'state';
import User from '../../components/widgets/user';

export const ProposalBodyAuthor: m.Component<{ item: SnapshotProposal }> = {
  view: (vnode) => {
    const { item } = vnode.attrs;
    if (!item) return;
    if (!item.authorAddress) return;



    return m('.ProposalBodyAuthor', [
      m(User, {
        user: new AddressInfo(null, item.authorAddress, app.activeId(), null), // TODO: activeID becomes chain_base, fix
        linkify: true,
        popover: true
      }),
    ]);
  }
};

export const ProposalBodyCreated: m.Component<{
  item: SnapshotProposal, link: string
}> = {
  view: (vnode) => {
    const { item, link } = vnode.attrs;
    if (!item) return;
    if (!item.timestamp) return;
    const time = moment(+item.start * 1000);

    return m('.ProposalBodyCreated', [
      m('', `Created ${formatLastUpdated(time)}`)
    ]);
  }
};

export const ProposalBodyLastEdited: m.Component<{ item: SnapshotProposal }> = {
  view: (vnode) => {
    const { item } = vnode.attrs;
    if (!item) return;
    if (!item.end) {
      return;
    }
    const time = moment(+item.end * 1000);

    return m('.ProposalBodyLastEdited', [
      m('', `Edited ${formatLastUpdated(time)}`)
    ]);
  }
};

export const ProposalBodyText: m.Component<{ item: SnapshotProposal }> = {
  view: (vnode) => {
    const { item } = vnode.attrs;
    if (!item) return;

    const body = item.body;
    if (!body) return;

    return m('.ProposalBodyText', [
      m(MarkdownFormattedText, { doc: body })
    ]);
  }
};
