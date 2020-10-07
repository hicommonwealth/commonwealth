import m from 'mithril';
import lity from 'lity';
import app from 'state';

import { OffchainThread, OffchainThreadKind, AddressInfo } from 'models';
import { link, slugify } from 'helpers';
import User from 'views/components/widgets/user';

const ProfileProposal : m.Component< { proposal: OffchainThread }, { revealThread: boolean } > = {
  view: (vnode) => {
    const proposal = vnode.attrs.proposal;
    const { slug, identifier } = proposal;
    const { attachments, author, body, title, createdAt, chain, community } = proposal;
    return m('.ProfileProposal', [
      m('.summary', [
        m(User, { user: new AddressInfo(null, author, proposal.authorChain, null), linkify: true, hideAvatar: true }),
        proposal.kind === OffchainThreadKind.Question ? ' added a question'
          : proposal.kind === OffchainThreadKind.Request ? ' added a task'
            : [
              ' created a new ',
              link('a', `/${chain || community}/proposal/${slug}/${identifier}-${slugify(title)}`, 'thread'),
            ],
        createdAt && [
          m.trust(' &middot; '),
          createdAt.fromNow(),
        ],
      ]),
      m('.activity.proposal', [
        proposal.kind === OffchainThreadKind.Forum || proposal.kind === OffchainThreadKind.Link
          ? link('a.proposal-title', `/${chain || community}/proposal/${slug}/${identifier}-${slugify(title)}`, title)
          : m('a.proposal-title', title),
        // TODO: show a truncated thread once we have a good formatting stripping helper
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
