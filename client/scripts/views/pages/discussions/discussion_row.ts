import 'pages/discussions/discussion_row.scss';

import { default as m } from 'mithril';
import { default as _ } from 'lodash';
import { default as moment } from 'moment-twitter';

import app from 'state';
import { pluralize, slugify, link, externalLink, extractDomain } from 'helpers';
import { Icon, Icons, Tag } from 'construct-ui';

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
    const lastUpdated = app.comments.lastCommented(proposal)
      || proposal.createdAt;

    const tagSortByName = (a, b) => {
      if (a.name > b.name) {
        return 1;
      } else if (a.name < b.name) {
        return -1;
      } else {
        return 0;
      }
    };

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
          m('.discussion-title', [
            link('a',
              `/${app.activeId()}/proposal/${proposal.slug}/${proposal.identifier}-${slugify(proposal.title)}`, [
                proposal.title
              ]),
            app.comments.nComments(proposal) > 0
              && link(
                'a.discussion-replies',
                `/${app.activeId()}/proposal/${proposal.slug}/${proposal.identifier}-${slugify(proposal.title)}`,
                [ app.comments.nComments(proposal), m(Icon, { name: Icons.MESSAGE_SQUARE }) ],
              ),
          ]),
          propType === OffchainThreadKind.Link
            && proposal.url
            && externalLink('a.discussion-link', proposal.url, [
              extractDomain(proposal.url),
              m.trust(' &rarr;'),
            ]),
          propType === OffchainThreadKind.Forum
            && (proposal as OffchainThread).body && m('.discussion-excerpt', [
            (() => {
              const body = (proposal as OffchainThread).body;
              try {
                const doc = JSON.parse(body);
                doc.ops = doc.ops.slice(0, 3);
                return m(QuillFormattedText, { doc, hideFormatting: true });
              } catch (e) {
                return m(MarkdownFormattedText, { doc: body.slice(0, 200), hideFormatting: true });
              }
            })(),
          ]),
          m('.discussion-meta', [
            m('.discussion-meta-left', [
              m(User, {
                user: [proposal.author, proposal.authorChain],
                linkify: true,
                tooltip: true,
              }),
              m('.discussion-last-updated', formatLastUpdated(lastUpdated)),
            ]),
            m('.discussion-meta-right', [
              m('.discussion-tags', proposal.tags.sort((a,b) => tagSortByName(a,b)).map((tag) => {
                return m(Tag, {
                  intent: 'primary',
                  label: tag.name,
                  size: 'xs',
                  onclick: (e) => m.route.set(`/${app.activeId()}/discussions/${tag.name}`),
                }, 'goo');
              })),
            ]),
          ]),
        ]),
      ]),
    ]);
  }
};

export default DiscussionRow;
