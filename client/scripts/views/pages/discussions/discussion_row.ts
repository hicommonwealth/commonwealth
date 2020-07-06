import 'pages/discussions/discussion_row.scss';

import m from 'mithril';
import _ from 'lodash';
import moment from 'moment-twitter';
import { Icon, Icons, Tag } from 'construct-ui';

import app from 'state';
import { pluralize, slugify, link, externalLink, extractDomain } from 'helpers';

import { OffchainThread, OffchainThreadKind, OffchainTag, AddressInfo } from 'models';
import MarkdownFormattedText from 'views/components/markdown_formatted_text';
import QuillFormattedText from 'views/components/quill_formatted_text';
import User from 'views/components/widgets/user';

import ThreadCaratMenu from './thread_carat_menu';

const formatLastUpdated = (timestamp) => {
  if (timestamp.isBefore(moment().subtract(365, 'days'))) return timestamp.format('MMM D YYYY');
  if (timestamp.isBefore(moment().subtract(30, 'days'))) return timestamp.format('MMM D');
  return timestamp.fromNow();
};

const DiscussionRow: m.Component<{ proposal: OffchainThread }, { expanded: boolean }> = {
  view: (vnode) => {
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

    const tagColor = '#72b483';

    const discussionLink = `/${app.activeId()}/proposal/${proposal.slug}/${proposal.identifier}-` +
      `${slugify(proposal.title)}`;

    return m('.DiscussionRow', { key: proposal.identifier }, [
      m('.discussion-row', [
        m('.discussion-top', [
          m('.discussion-top-left', [
            m('.discussion-title', link('a', discussionLink, proposal.title)),
            m('.discussion-meta', [
              proposal.tag && link('a.proposal-tag', `/${app.activeId()}/discussions/${proposal.tag.name}`, [
                m('span.proposal-tag-icon', { style: `background: ${tagColor}` }),
                m('span.proposal-tag-name', `${proposal.tag.name}`),
              ]),
              m(User, {
                user: new AddressInfo(null, proposal.author, proposal.authorChain, null),
                linkify: true,
                tooltip: true,
                showRole: true,
                hideAvatar: true,
              }),
              m('.discussion-last-updated', formatLastUpdated(lastUpdated)),
            ]),
          ]),
          m('.discussion-top-right', [
            m(ThreadCaratMenu, { proposal }),
          ]),
        ]),
        m('.discussion-content', [
          propType === OffchainThreadKind.Forum
            && (proposal as OffchainThread).body
            && m('.discussion-excerpt', [
              (() => {
                const body = (proposal as OffchainThread).body;
                try {
                  const doc = JSON.parse(body);
                  return m(QuillFormattedText, {
                    doc,
                    collapse: !vnode.state.expanded,
                    hideFormatting: true,
                  });
                } catch (e) {
                  return m(MarkdownFormattedText, {
                    doc: body,
                    collapse: !vnode.state.expanded,
                    hideFormatting: true,
                  });
                }
              })(),
              !vnode.state.expanded && m('a', {
                href: '#',
                onclick: (e) => {
                  e.preventDefault();
                  vnode.state.expanded = true;
                }
              }, 'See more'),
            ]),
          propType === OffchainThreadKind.Link
            && proposal.url
            && externalLink('a.discussion-link', proposal.url, [
              extractDomain(proposal.url),
              m.trust(' &rarr;'),
            ]),
        ]),
        m('.discussion-bottom', [
          m('.discussion-commenters', app.comments.nComments(proposal) > 0 ? [
            m('.commenters-avatars', app.comments.uniqueCommenters(proposal).map(([chain, address]) => {
              return m(User, { user: new AddressInfo(null, address, chain, null), avatarOnly: true, tooltip: true, avatarSize: 20 });
            })),
            link(
              'a.commenters-label',
              `/${app.activeId()}/proposal/${proposal.slug}/${proposal.identifier}-${slugify(proposal.title)}`,
              pluralize(app.comments.nComments(proposal), 'reply'),
            ),
          ] : [
            link(
              'a.no-commenters-label',
              `/${app.activeId()}/proposal/${proposal.slug}/${proposal.identifier}-${slugify(proposal.title)}`,
              'No replies',
            ),
          ]),
        ]),
      ]),
    ]);
  }
};

export default DiscussionRow;
