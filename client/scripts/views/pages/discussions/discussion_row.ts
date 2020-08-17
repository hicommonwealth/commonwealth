import 'pages/discussions/discussion_row.scss';

import m from 'mithril';
import _ from 'lodash';
import moment from 'moment-twitter';
import { Icon, Icons, Tag } from 'construct-ui';

import app from 'state';
import { pluralize, slugify, link, externalLink, extractDomain } from 'helpers';

import { OffchainThread, OffchainThreadKind, AddressInfo } from 'models';
import ReactionButton, { ReactionType } from 'views/components/reaction_button';
import User from 'views/components/widgets/user';

import DiscussionRowMenu from './discussion_row_menu';
import UserGallery from '../../components/widgets/user_gallery';
import ListingRow from '../../components/listing_row';

const formatLastUpdated = (timestamp) => {
  if (timestamp.isBefore(moment().subtract(365, 'days'))) return timestamp.format('MMM D YYYY');
  if (timestamp.isBefore(moment().subtract(30, 'days'))) return timestamp.format('MMM D');
  const formatted = timestamp.fromNow(true);
  if (formatted.indexOf(' month') !== -1) {
    return timestamp.format('MMM D');
  } else {
    return formatted
      .replace(' days', 'd')
      .replace(' day', 'd')
      .replace(' hours', 'h')
      .replace(' hour', 'h');
  }
};

const DiscussionRow: m.Component<{ proposal: OffchainThread }, { expanded: boolean }> = {
  view: (vnode) => {
    const proposal: OffchainThread = vnode.attrs.proposal;
    if (!proposal) return;
    const propType: OffchainThreadKind = proposal.kind;
    const lastUpdated = app.comments.lastCommented(proposal) || proposal.createdAt;

    const discussionLink = `/${app.activeId()}/proposal/${proposal.slug}/${proposal.identifier}-`
      + `${slugify(proposal.title)}`;

    const rowHeader = (propType === OffchainThreadKind.Link && proposal.url)
      ? externalLink('a.external-discussion-link', proposal.url, [
        proposal.title, m.trust('&nbsp;'), m(Icon, { name: Icons.EXTERNAL_LINK })
      ])
      : link('a', discussionLink, proposal.title);

    const pinned = proposal.pinned;

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
      (propType === OffchainThreadKind.Link && proposal.url) && m('.discussion-link', [
        `Link: ${extractDomain(proposal.url)}`
      ]),
      m(User, {
        user: new AddressInfo(null, proposal.author, proposal.authorChain, null),
        linkify: true,
        tooltip: true,
        hideAvatar: true,
      }),
    ];

    const rowMetadata = [
      m(UserGallery, {
        avatarSize: 24,
        tooltip: true,
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
        pinned,
      },
      key: proposal.id,
      contentRight: rowMetadata,
      rightColSpacing: [4, 4, 3, 1],
      onclick: (e) => {
        e.preventDefault();
        m.route.set(discussionLink);
      },
    });
  }
};

export default DiscussionRow;
