import 'pages/discussions/discussion_row.scss';

import { default as m } from 'mithril';
import { default as _ } from 'lodash';
import { default as moment } from 'moment-twitter';

import app from 'state';
import { pluralize, slugify, link, externalLink } from 'helpers';

import User from 'views/components/widgets/user';
import { OffchainThread, OffchainThreadKind } from 'models';
import MarkdownFormattedText from 'views/components/markdown_formatted_text';
import QuillFormattedText from 'views/components/quill_formatted_text';

interface IAttrs {
  proposal: OffchainThread;
}

const formatLastUpdated = (timestamp) => {
  if (timestamp.isBefore(moment().subtract(365, 'days'))) return timestamp.format('MMM D YYYY');
  if (timestamp.isBefore(moment().subtract(30, 'days'))) return timestamp.format('MMM D');
  return timestamp.fromNow();
};

const DiscussionRow: m.Component<IAttrs> = {
  view: (vnode: m.VnodeDOM<IAttrs>) => {
    const proposal: OffchainThread = vnode.attrs.proposal;
    if (!proposal) return;
    const propType: OffchainThreadKind = proposal.kind;
    const lastUpdated = app.comments.lastCommented(proposal) ||
      proposal.createdAt;
    const domainSlice = (url) => {
      const re = new RegExp('^(?:https?:)?(?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n]+)');
      return re.exec(url)[1];
    };
    const getContent = (proposal) => [
      link('a.discussion-title',
        `/${app.activeId()}/proposal/${proposal.slug}/${proposal.identifier}-${slugify(proposal.title)}`, [
          proposal.title
        ]),
      propType === OffchainThreadKind.Link
        && proposal.url
        && externalLink('a.discussion-link', proposal.url, domainSlice(proposal.url)),
      propType === OffchainThreadKind.Forum
        && (proposal as OffchainThread).body && m('.discussion-excerpt', [
          (() => {
            const body = (proposal as OffchainThread).body;
            try {
              const doc = JSON.parse(body);
              doc.ops = doc.ops.slice(0, 3);
              return m(QuillFormattedText, { doc, hideFormatting: true });
            } catch (e) {
              return m(MarkdownFormattedText, { doc: body.slice(0, 200) });
            }
          })(),
        ]),
    ];

    return m('.DiscussionRow', { key: proposal.identifier }, [
      m('.discussion-row', [
        m('.discussion-pre', [
          m(User, {
            user: [proposal.author, proposal.authorChain],
            avatarOnly: true,
            avatarSize: 30,
            tooltip: true,
          }),
        ]),
        m('.discussion-pre-mobile', [
          m(User, {
            user: [proposal.author, proposal.authorChain],
            avatarOnly: true,
            avatarSize: 16,
            tooltip: true,
          }),
        ]),
        m('.discussion-content', [
          m('.discussion-content-top', [
            getContent(proposal),
          ]),
          m('.discussion-meta', [
            m(User, {
              user: [proposal.author, proposal.authorChain],
              linkify: true,
              tooltip: true,
            }),
            app.comments.nComments(proposal) > 0 && [
              m.trust(' &mdash; '),
              link('a.discussion-replies',
                   `/${app.activeId()}/proposal/${proposal.slug}/${proposal.identifier}-${slugify(proposal.title)}`, [
                     pluralize(app.comments.nComments(proposal), 'comment'),
                   ]),
            ],
            //formatLastUpdated(lastUpdated),
          ]),
        ]),
        m('.discussion-after', [
            proposal.tags.map((tag) => {
              return link('a.discussion-tag', `/${app.activeId()}/discussions/${tag.name}`, `#${tag.name}`);
            }),
        ]),
      ]),
      m('.discussion-content-mobile', getContent(proposal)),
    ]);
  }
};

export default DiscussionRow;
