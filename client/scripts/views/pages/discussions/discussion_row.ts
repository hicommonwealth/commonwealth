import 'pages/discussions/discussion_row.scss';

import m from 'mithril';
import _ from 'lodash';
import moment from 'moment-twitter';
import { Icon, Icons, Tag } from 'construct-ui';

import app from 'state';
import { pluralize, slugify, link, externalLink, extractDomain } from 'helpers';

import { OffchainThread, OffchainThreadKind, OffchainTag, AddressInfo } from 'models';
import ReactionButton, { ReactionType } from 'views/components/reaction_button';
import MarkdownFormattedText from 'views/components/markdown_formatted_text';
import QuillFormattedText from 'views/components/quill_formatted_text';
import User from 'views/components/widgets/user';

import ThreadCaratMenu from './thread_carat_menu';

const formatLastUpdated = (timestamp) => {
  if (timestamp.isBefore(moment().subtract(365, 'days'))) return timestamp.format('MMM D YYYY');
  if (timestamp.isBefore(moment().subtract(30, 'days'))) return timestamp.format('MMM D');
  const formatted = timestamp.fromNow(true);
  if (formatted.indexOf(' month') !== -1) {
    return timestamp.format('MMM D');
  } else {
    return formatted.replace(' days', 'd').replace(' hours', 'h');
  }
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

    const discussionLink = `/${app.activeId()}/proposal/${proposal.slug}/${proposal.identifier}-`
      + `${slugify(proposal.title)}`;

    return m('.DiscussionRow', { key: proposal.identifier }, [
      m('.discussion-row', [
        m('.discussion-top', [
          m('.discussion-top-left', [
            m('.discussion-title', [
              (propType === OffchainThreadKind.Link && proposal.url)
                ? externalLink(
                  'a.discussion-link',
                  proposal.url,
                  [ proposal.title, m.trust('&nbsp;'), m(Icon, { name: Icons.EXTERNAL_LINK }) ]
                )
                : link('a', discussionLink, proposal.title),
            ]),
            m('.discussion-meta', [
              proposal.tag && link('a.proposal-tag', `/${app.activeId()}/discussions/${proposal.tag.name}`, [
                m('span.proposal-tag-icon', { style: `background: ${tagColor}` }),
                m('span.proposal-tag-name', `${proposal.tag.name}`),
              ]),
              (propType === OffchainThreadKind.Link && proposal.url) && m('.discussion-link', [
                `Link: ${extractDomain(proposal.url)}`
              ]),
              m(User, {
                user: new AddressInfo(null, proposal.author, proposal.authorChain, null),
                linkify: true,
                tooltip: true,
                showRole: true,
                hideAvatar: true,
              }),
            ]),
          ]),
          m('.discussion-top-right', [
            m('.discussion-commenters', [
              m('.commenters-avatars', app.comments.uniqueCommenters(proposal)
                .map(([chain, address]) => {
                  return m(User, {
                    user: new AddressInfo(null, address, chain, null),
                    avatarOnly: true,
                    tooltip: true,
                    avatarSize: 24,
                  });
                })),
            ]),
            m(ReactionButton, { post: proposal, type: ReactionType.Like, tooltip: true }),
            m('.discussion-last-updated', {
              class: lastUpdated.isBefore(moment().subtract(365, 'days')) ? 'older' : '',
            }, [
              link('a', discussionLink, formatLastUpdated(lastUpdated)),
            ]),
            m(ThreadCaratMenu, { proposal }),
          ]),
        ]),
      ]),
    ]);
  }
};

export default DiscussionRow;
