import 'pages/discussions/discussion_row.scss';

import m from 'mithril';
import _ from 'lodash';
import $ from 'jquery';
import moment from 'moment-twitter';
import { Icon, Icons, Tag } from 'construct-ui';

import { updateRoute } from 'app';
import app from 'state';
import { formatLastUpdated, slugify, link, externalLink, extractDomain } from 'helpers';

import { OffchainThread, OffchainThreadKind, AddressInfo } from 'models';
import ReactionButton, { ReactionType } from 'views/components/reaction_button';
import User from 'views/components/widgets/user';
import QuillFormattedText from 'views/components/quill_formatted_text';
import MarkdownFormattedText from 'views/components/markdown_formatted_text';

import DiscussionRowMenu from './discussion_row_menu';
import UserGallery from '../../components/widgets/user_gallery';
import ListingRow from '../../components/listing_row';

const DiscussionRow: m.Component<{ proposal: OffchainThread, showExcerpt?: boolean }, { expanded: boolean }> = {
  view: (vnode) => {
    const { proposal, showExcerpt } = vnode.attrs;
    if (!proposal) return;
    const propType: OffchainThreadKind = proposal.kind;
    const lastUpdated = app.comments.lastCommented(proposal) || proposal.createdAt;
    const pinned = proposal.pinned;
    const discussionLink = `/${app.activeId()}/proposal/${proposal.slug}/${proposal.identifier}-`
      + `${slugify(proposal.title)}`;

    const rowHeader = [
      (propType === OffchainThreadKind.Link && proposal.url)
        && externalLink('a.external-discussion-link', proposal.url, [
          extractDomain(proposal.url),
        ]),
      (propType === OffchainThreadKind.Link && proposal.url)
        && m('span.spacer', ' '),
      link('a', discussionLink, proposal.title),
    ];
    const rowSubheader = [
      proposal.readOnly && m('.discussion-locked', [
        m(Tag, {
          size: 'xs',
          label: [
            m(Icon, { name: Icons.LOCK, size: 'xs' }),
          ],
        }),
      ]),
      proposal.topic && link('a.proposal-topic', `/${app.activeId()}/discussions/${proposal.topic.name}`, [
        m('span.proposal-topic-icon'),
        m('span.proposal-topic-name', `${proposal.topic.name}`),
      ]),
      m(User, {
        user: new AddressInfo(null, proposal.author, proposal.authorChain, null),
        linkify: true,
        popover: true,
        hideAvatar: true,
      }),
      m('.mobile-comment-count', [
        m(Icon, { name: Icons.MESSAGE_SQUARE }),
        app.comments.nComments(proposal),
      ]),
    ];

    const rowExcerpt = showExcerpt
      && proposal instanceof OffchainThread
      && proposal.body
      && m('.row-excerpt', [
        (() => {
          try {
            const doc = JSON.parse(proposal.body);
            if (!doc.ops) throw new Error();
            return m(QuillFormattedText, { doc, collapse: true, hideFormatting: true });
          } catch (e) {
            return m(MarkdownFormattedText, { doc: proposal.body, collapse: true, hideFormatting: true });
          }
        })(),
      ]);

    const rowMetadata = [
      m(UserGallery, {
        avatarSize: 24,
        popover: true,
        maxUsers: 4,
        users: app.comments.uniqueCommenters(
          proposal,
          proposal.author,
          proposal.authorChain
        )
      }),
      m(ReactionButton, {
        post: proposal,
        type: ReactionType.Like,
        tooltip: true
      }),
      m('.last-updated', {
        class: lastUpdated.isBefore(moment().subtract(365, 'days'))
          ? 'older'
          : ''
      }, link('a', discussionLink, formatLastUpdated(lastUpdated))),
      app.isLoggedIn() && m('.discussion-row-menu', [
        m(DiscussionRowMenu, { proposal }),
      ]),
    ];

    return m(ListingRow, {
      class: 'DiscussionRow',
      contentLeft: {
        header: rowHeader,
        subheader: rowSubheader,
        subheader2: rowExcerpt,
        pinned,
      },
      key: proposal.id,
      contentRight: rowMetadata,
      rightColSpacing: app.isLoggedIn() ?  [4, 4, 3, 1] : [4, 4, 4],
      onclick: (e) => {
        if ($(e.target).hasClass('cui-tag')) return;
        if (e.metaKey || e.altKey || e.shiftKey || e.ctrlKey) return;
        e.preventDefault();
        localStorage[`${app.activeId()}-discussions-scrollY`] = window.scrollY;
        updateRoute(discussionLink);
      },
    });
  }
};

export default DiscussionRow;
