import m from 'mithril';
import lity from 'lity';
import { slugify } from 'utils';

import app from 'state';
import { OffchainThread, OffchainThreadKind, AddressInfo } from 'models';
import { link } from 'helpers';
import { getProposalUrlPath } from 'identifiers';
import User from 'views/components/widgets/user';

const ProfileProposal: m.Component<
  { proposal: OffchainThread },
  { revealThread: boolean }
> = {
  view: (vnode) => {
    const proposal = vnode.attrs.proposal;
    const { slug, identifier } = proposal;
    const { attachments, author, body, title, createdAt, chain } = proposal;

    // hide rows from communities that don't match
    if (app.isCustomDomain() && chain !== app.customDomainId()) return;

    return m('.ProfileProposal', [
      m('.summary', [
        m('', [
          proposal.kind === OffchainThreadKind.Question
            ? 'Added a question'
            : proposal.kind === OffchainThreadKind.Request
            ? 'added a task'
            : [
                'Created a new ',
                link(
                  'a.link-bold',
                  `/${chain}${getProposalUrlPath(
                    slug,
                    `${identifier}-${slugify(title)}`,
                    true
                  )}`,
                  'thread',
                  {},
                  `profile-${author}-${proposal.authorChain}-${proposal.chain}-scrollY`
                ),
                ' in ',
                link('a.link-bold', `/${chain}`, `${chain}`),
              ],
        ]),
        createdAt && createdAt.fromNow(),
      ]),
      m('.activity.proposal', [
        proposal.kind === OffchainThreadKind.Forum ||
        proposal.kind === OffchainThreadKind.Link
          ? link(
              'a.proposal-title',
              `/${chain}${getProposalUrlPath(
                slug,
                `${identifier}-${slugify(title)}`,
                true
              )}`,
              title,
              {},
              `profile-${author}-${proposal.authorChain}-${proposal.chain}-scrollY`
            )
          : m('a.proposal-title', title),
        // TODO: show a truncated thread once we have a good formatting stripping helper
        attachments &&
          attachments.length > 0 &&
          m('.proposal-attachments', [
            m('p', `Attachments (${attachments.length})`),
            attachments.map((attachment) =>
              m(
                'a.attachment-item',
                {
                  href: attachment.url,
                  title: attachment.description,
                  target: '_blank',
                  noopener: 'noopener',
                  noreferrer: 'noreferrer',
                  onclick: (e) => {
                    e.preventDefault();
                    lity(attachment.url);
                  },
                },
                [
                  m('img', {
                    src: attachment.url,
                  }),
                ]
              )
            ),
          ]),
      ]),
    ]);
  },
};

export default ProfileProposal;
