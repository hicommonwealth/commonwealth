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
import UserGallery from 'views/components/widgets/user_gallery';
import ListingRow from 'views/components/listing_row';

import DiscussionRowMenu from './discussion_row_menu';

const DiscussionRow: m.Component<{ proposal: OffchainThread, showExcerpt?: boolean }, { expanded: boolean }> = {
  view: (vnode) => {
    const { proposal, showExcerpt } = vnode.attrs;
    if (!proposal) return;
    const propType: OffchainThreadKind = proposal.kind;
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
      m('.created-at', link('a', discussionLink, formatLastUpdated(proposal.createdAt))),
      m(User, {
        user: new AddressInfo(null, proposal.author, proposal.authorChain, null),
        linkify: true,
        popover: true,
        hideAvatar: true,
        showAddressWithDisplayName: true,
      }),
      proposal instanceof OffchainThread && proposal.collaborators && proposal.collaborators.length > 0
        && m('span.proposal-collaborators', [ ' +', proposal.collaborators.length ]),
      m('.mobile-comment-count', [
        m(Icon, { name: Icons.MESSAGE_SQUARE }),
        app.comments.nComments(proposal),
      ]),
    ];

    const rowMetadata = [
      m(UserGallery, {
        avatarSize: 20,
        popover: true,
        maxUsers: 4,
        users: app.comments.uniqueCommenters(
          proposal,
          proposal.author,
          proposal.authorChain
        )
      }),
      app.isLoggedIn() && m('.discussion-row-menu', [
        m(DiscussionRowMenu, { proposal }),
      ]),
    ];

    const reaction = m(ReactionButton, {
      post: proposal,
      type: ReactionType.Like,
      tooltip: true,
      large: true,
    });

    return m(ListingRow, {
      class: 'DiscussionRow',
      contentLeft: {
        reaction,
        header: rowHeader,
        subheader: rowSubheader,
        pinned,
      },
      contentRight: rowMetadata,
      rightColSpacing: app.isLoggedIn() ? [10, 2] : [12],
      key: proposal.id,
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
