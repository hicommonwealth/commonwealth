import 'pages/view_proposal/editor_permissions.scss';

import m from 'mithril';

import { updateRoute } from 'app';
import { formatLastUpdated } from 'helpers';
import { SnapshotProposal } from 'models';

import MarkdownFormattedText from 'views/components/markdown_formatted_text';
import moment from 'moment';

export const ProposalBodyAuthor: m.Component<{ item: SnapshotProposal }> = {
  view: (vnode) => {
    const { item } = vnode.attrs;
    if (!item) return;
    if (!item.authorAddress) return;

    return m('.ProposalBodyAuthor', [
      m('a', {
        href: '#',
        onclick: async (e) => {
          e.preventDefault();
        }
      }, `Author ${item.authorAddress}`)
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
      m('a', {
        href: link,
        onclick: (e) => {
          e.preventDefault();
          const target = link;
          if (target === document.location.href) return;
          // use updateRoute instead of m.route.set to avoid resetting scroll point
          updateRoute(target, {}, { replace: true });
        }
      }, `Created ${formatLastUpdated(time)}`)
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
      m('a', {
        href: '#',
        onclick: async (e) => {
          e.preventDefault();
        }
      }, `Edited ${formatLastUpdated(time)}`)
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
