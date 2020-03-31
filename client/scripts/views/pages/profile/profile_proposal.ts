import m from 'mithril';
import lity from 'lity';
import app from 'state';
import { OffchainThread, OffchainThreadKind } from '../../../models/models';
import User from '../../components/widgets/user';
import { link, slugify } from '../../../helpers';

const ProfileProposal : m.Component< { proposal: OffchainThread }, { revealThread: boolean } > = {
  view: (vnode) => {
    const proposal = vnode.attrs.proposal;
    const { slug, identifier } = proposal;
    const { attachments, author, body, title, createdAt } = proposal;

    return m('.ProfileProposal', [
      m('.summary', [
        m(User, { user: [author, proposal.authorChain], linkify: true, hideAvatar: true }),
        proposal.kind === OffchainThreadKind.Question ? ' added a question' :
          proposal.kind === OffchainThreadKind.Request ? ' added a task' :
            ' created a new thread',
        ` ${createdAt.fromNow()}`
      ]),
      m('.activity.proposal', [
        proposal.kind === OffchainThreadKind.Forum ?
          link('a.proposal-title', `/${app.activeChainId()}/proposal/${slug}/${identifier}-${slugify(title)}`, title) :
          m('a.proposal-title', title),
        // TODO: show a truncated thread once we have a good formatting stripping helper
        // proposal.kind === OffchainThreadKind.Forum && body && vnode.state.revealThread &&
        //   m('.proposal-description', (() => {
        //     const previewLength = 150;
        //     const truncatedThread = body.length > previewLength && vnode.state.revealThread !== proposal);
        //     try {
        //       let doc = JSON.parse(body);
        //       if (truncatedThread) doc = sliceQuill(doc, previewLength);
        //       return ([
        //         m(QuillFormattedText, { doc }),
        //         // truncatedThread && m('a', {
        //         //   href: '#',
        //         //   onclick: (e) => {
        //         //     e.preventDefault();
        //         //     vnode.state.revealThread = proposal;
        //         //   }
        //         // }, 'more')
        //       ]);
        //     } catch (e) {
        //       return ([
        //         m(MarkdownFormattedText, { doc: body }),
        //         // truncatedThread && m('a', {
        //         //   href: '#',
        //         //   onclick: (e) => {
        //         //     e.preventDefault();
        //         //     vnode.state.revealThread = proposal;
        //         //   }
        //         // }, 'more')
        //       ]);
        //     }
        //   })()),
        attachments && attachments.length > 0 && m('.proposal-attachments', [
          m('p', `Attachments (${attachments.length})`),
          attachments.map((attachment) => m('a.attachment-item', {
            href: attachment.url,
            title: attachment.description,
            target: '_blank',
            noopener: 'noopener',
            noreferrer: 'noreferrer',
            onclick: (e) => {
              e.preventDefault();
              lity(attachment.url);
            }
          }, [
            m('img', {
              src: attachment.url
            }),
          ]))
        ]),
      ]),
    ]);
  }
};

export default ProfileProposal;
