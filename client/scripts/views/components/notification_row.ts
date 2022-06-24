import 'components/notification_row.scss';

import { Spinner } from 'construct-ui';
import _ from 'lodash';
import m from 'mithril';
import moment from 'moment';
import { CWEvent, Label as ChainEventLabel } from '@commonwealth/chain-events';

import app from 'state';
import {
  NotificationCategories,
  IPostNotificationData,
  ProposalType,
} from 'types';
import { Notification, AddressInfo } from 'models';
import { link, pluralize } from 'helpers';

import QuillFormattedText from 'views/components/quill_formatted_text';
import MarkdownFormattedText from 'views/components/markdown_formatted_text';
import jumpHighlightComment from 'views/pages/view_proposal/jump_to_comment';
import User from 'views/components/widgets/user';
import UserGallery from 'views/components/widgets/user_gallery';

import { getProposalUrl, getCommunityUrl } from '../../../../shared/utils';
import { CWIcon } from './component_kit/cw_icons/cw_icon';

const getCommentPreview = (comment_text) => {
  let decoded_comment_text;
  try {
    const doc = JSON.parse(decodeURIComponent(comment_text));
    if (!doc.ops) throw new Error();
    decoded_comment_text = m(QuillFormattedText, {
      doc,
      hideFormatting: true,
      collapse: true,
    });
  } catch (e) {
    let doc = decodeURIComponent(comment_text);
    const regexp = RegExp('\\[(\\@.+?)\\]\\(.+?\\)', 'g');
    const matches = doc['matchAll'](regexp);
    Array.from(matches).forEach((match) => {
      doc = doc.replace(match[0], match[1]);
    });
    decoded_comment_text = m(MarkdownFormattedText, {
      doc: doc.slice(0, 140),
      hideFormatting: true,
      collapse: true,
    });
  }
  return decoded_comment_text;
};

const getNotificationFields = (category, data: IPostNotificationData) => {
  const {
    created_at,
    root_id,
    root_title,
    root_type,
    comment_id,
    comment_text,
    parent_comment_id,
    parent_comment_text,
    chain_id,
    author_address,
    author_chain,
  } = data;

  const community_name =
    app.config.chains.getById(chain_id)?.name || 'Unknown chain';

  let notificationHeader;
  let notificationBody;
  const decoded_title = decodeURIComponent(root_title).trim();

  if (comment_text) {
    notificationBody = getCommentPreview(comment_text);
  } else if (root_type === ProposalType.OffchainThread) {
    notificationBody = null;
  }

  const actorName = m(User, {
    user: new AddressInfo(null, author_address, author_chain, null),
    hideAvatar: true,
    hideIdentityIcon: true,
  });

  if (category === NotificationCategories.NewComment) {
    // Needs logic for notifications issued to parents of nested comments
    notificationHeader = parent_comment_id
      ? m('span', [
          actorName,
          ' commented on ',
          m('span.commented-obj', decoded_title),
        ])
      : m('span', [
          actorName,
          ' responded in ',
          m('span.commented-obj', decoded_title),
        ]);
  } else if (category === NotificationCategories.NewThread) {
    notificationHeader = m('span', [
      actorName,
      ' created a new thread ',
      m('span.commented-obj', decoded_title),
    ]);
  } else if (category === `${NotificationCategories.NewMention}`) {
    notificationHeader = m('span', [
      actorName,
      ' mentioned you in ',
      m('span.commented-obj', decoded_title),
    ]);
  } else if (category === `${NotificationCategories.NewCollaboration}`) {
    notificationHeader = m('span', [
      actorName,
      ' added you as a collaborator on ',
      m('span.commented-obj', decoded_title),
    ]);
  } else if (category === `${NotificationCategories.NewReaction}`) {
    notificationHeader = !comment_id
      ? m('span', [
          actorName,
          ' liked the post ',
          m('span.commented-obj', decoded_title),
        ])
      : m('span', [
          actorName,
          ' liked your comment in ',
          m('span.commented-obj', decoded_title || community_name),
        ]);
  }
  const pseudoProposal = {
    id: root_id,
    title: root_title,
    chain: chain_id,
  };
  const args = comment_id
    ? [root_type, pseudoProposal, { id: comment_id }]
    : [root_type, pseudoProposal];
  const path = (getProposalUrl as any)(...args);
  const pageJump = comment_id
    ? () => jumpHighlightComment(comment_id)
    : () => jumpHighlightComment('parent');

  return {
    authorInfo: [[author_chain, author_address]],
    createdAt: moment.utc(created_at),
    notificationHeader,
    notificationBody,
    path,
    pageJump,
  };
};

const getBatchNotificationFields = (
  category,
  data: IPostNotificationData[]
) => {
  if (data.length === 1) {
    return getNotificationFields(category, data[0]);
  }

  const {
    created_at,
    root_id,
    root_title,
    root_type,
    comment_id,
    comment_text,
    parent_comment_id,
    parent_comment_text,
    chain_id,
    author_address,
    author_chain,
  } = data[0];

  const authorInfo = _.uniq(
    data.map((d) => `${d.author_chain}#${d.author_address}`)
  ).map((u) => u.split('#'));
  const length = authorInfo.length - 1;
  const community_name =
    app.config.chains.getById(chain_id)?.name || 'Unknown chain';

  let notificationHeader;
  let notificationBody;
  const decoded_title = decodeURIComponent(root_title).trim();

  if (comment_text) {
    notificationBody = getCommentPreview(comment_text);
  } else if (root_type === ProposalType.OffchainThread) {
    notificationBody = null;
  }

  const actorName = m(User, {
    user: new AddressInfo(null, author_address, author_chain, null),
    hideAvatar: true,
    hideIdentityIcon: true,
  });

  if (category === NotificationCategories.NewComment) {
    // Needs logic for notifications issued to parents of nested comments
    notificationHeader = parent_comment_id
      ? m('span', [
          actorName,
          length > 0 && ` and ${pluralize(length, 'other')}`,
          ' commented on ',
          m('span.commented-obj', decoded_title),
        ])
      : m('span', [
          actorName,
          length > 0 && ` and ${pluralize(length, 'other')}`,
          ' responded in ',
          m('span.commented-obj', decoded_title),
        ]);
  } else if (category === NotificationCategories.NewThread) {
    notificationHeader = m('span', [
      actorName,
      length > 0 && ` and ${pluralize(length, 'other')}`,
      ' created new threads in ',
      m('span.commented-obj', community_name),
    ]);
  } else if (category === `${NotificationCategories.NewMention}`) {
    notificationHeader = !comment_id
      ? m('span', [
          actorName,
          length > 0 && ` and ${pluralize(length, 'other')}`,
          ' mentioned you in ',
          m('span.commented-obj', community_name),
        ])
      : m('span', [
          actorName,
          length > 0 && ` and ${pluralize(length, 'other')}`,
          ' mentioned you in ',
          m('span.commented-obj', decoded_title || community_name),
        ]);
  } else if (category === `${NotificationCategories.NewReaction}`) {
    notificationHeader = !comment_id
      ? m('span', [
          actorName,
          length > 0 && ` and ${pluralize(length, 'other')}`,
          ' liked the post ',
          m('span.commented-obj', decoded_title),
        ])
      : m('span', [
          actorName,
          length > 0 && ` and ${pluralize(length, 'other')}`,
          ' liked your comment in ',
          m('span.commented-obj', decoded_title || community_name),
        ]);
  }
  const pseudoProposal = {
    id: root_id,
    title: root_title,
    chain: chain_id,
  };
  const args = comment_id
    ? [root_type, pseudoProposal, { id: comment_id }]
    : [root_type, pseudoProposal];
  const path =
    category === NotificationCategories.NewThread
      ? (getCommunityUrl as any)(chain_id)
      : (getProposalUrl as any)(...args);
  const pageJump = comment_id
    ? () => jumpHighlightComment(comment_id)
    : () => jumpHighlightComment('parent');
  return {
    authorInfo,
    createdAt: moment.utc(created_at),
    notificationHeader,
    notificationBody,
    path,
    pageJump,
  };
};

const NotificationRow: m.Component<
  {
    notifications: Notification[];
    onListPage?: boolean;
  },
  {
    scrollOrStop: boolean;
    markingRead: boolean;
  }
> = {
  oncreate: (vnode) => {
    if (
      m.route.param('id') &&
      vnode.attrs.onListPage &&
      m.route.param('id') === vnode.attrs.notifications[0].id.toString()
    ) {
      vnode.state.scrollOrStop = true;
    }
  },
  view: (vnode) => {
    const { notifications } = vnode.attrs;
    const notification = notifications[0];
    const { category } = notifications[0].subscription;
    if (category === NotificationCategories.ChainEvent) {
      if (!notification.chainEvent) {
        throw new Error('chain event notification does not have expected data');
      }
      const chainId = notification.chainEvent.type.chain;

      // construct compatible CW event from DB by inserting network from type
      const chainEvent: CWEvent = {
        blockNumber: notification.chainEvent.blockNumber,
        network: notification.chainEvent.type.eventNetwork,
        data: notification.chainEvent.data,
      };
      const chainName = app.config.chains.getById(chainId)?.name;

      if (app.isCustomDomain() && chainId !== app.customDomainId()) return;
      const label = ChainEventLabel(chainId, chainEvent);

      if (vnode.state.scrollOrStop) {
        setTimeout(() => {
          const el = document.getElementById(m.route.param('id'));
          if (el) el.scrollIntoView();
        }, 1);
        vnode.state.scrollOrStop = false;
      }

      if (!label) {
        return m(
          'li.NotificationRow',
          {
            class: notification.isRead ? '' : 'unread',
            key: notification.id,
            id: notification.id,
          },
          [m('.comment-body', [m('.comment-body-top', 'Loading...')])]
        );
      }
      return link(
        'a.NotificationRow',
        `/notifications?id=${notification.id}`,
        [
          m('.comment-body', [
            m('.comment-body-top.chain-event-notification-top', [
              `${label.heading} on ${chainName}`,
              !vnode.attrs.onListPage &&
                m(CWIcon, {
                  iconName: 'close',
                  onmousedown: (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  },
                  onclick: (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    vnode.state.scrollOrStop = true;
                    app.user.notifications.delete([notification]).then(() => {
                      m.redraw();
                    });
                  },
                }),
            ]),
            m(
              '.comment-body-bottom',
              `Block ${notification.chainEvent.blockNumber}`
            ),
            m('.comment-body-excerpt', label.label),
          ]),
        ],
        {
          class: notification.isRead ? '' : 'unread',
          key: notification.id,
          id: notification.id,
        },
        null,
        () => {
          if (vnode.state.scrollOrStop) {
            vnode.state.scrollOrStop = false;
            return;
          }
          app.user.notifications
            .markAsRead([notification])
            .then(() => m.redraw());
        },
        () => m.redraw.sync()
      );
    } else if (category === NotificationCategories.NewChatMention) {
      const {
        chain_id,
        author_address,
        created_at,
        message_id,
        channel_id
      } = JSON.parse(notification.data);
      const route = app.socket.chatNs.getRouteToMessage(channel_id, message_id, chain_id)
      const author = new AddressInfo(
        null,
        author_address,
        chain_id,
        null
      )

      const authorName = m(User, {
        user: author,
        hideAvatar: true,
        hideIdentityIcon: true,
      });

      return link(
          'a.NotificationRow',
          route,
          [
            m(User, {
              user: author,
              avatarOnly: true,
              avatarSize: 26,
            }),
            m('.comment-body', [
              m('.comment-body-title', m('span', [
                authorName,
                ' mentioned you in ',
                m('span.commented-obj', chain_id),
                ' chat '
              ])),
              m('.comment-body-bottom-wrap', [
                m('.comment-body-created', moment(created_at).fromNow()),
                !notification.isRead &&
                  m(
                    '.comment-body-mark-as-read',
                    {
                      onclick: (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        vnode.state.markingRead = true;
                        app.user.notifications
                          .markAsRead(notifications)
                          ?.then(() => {
                            vnode.state.markingRead = false;
                            m.redraw();
                          })
                          .catch(() => {
                            vnode.state.markingRead = false;
                            m.redraw();
                          });
                      },
                    },
                    [
                      vnode.state.markingRead
                        ? m(Spinner, { size: 'xs', active: true })
                        : 'Mark as read',
                    ]
                  ),
              ]),
            ]),
          ],
          {
            class: notification.isRead ? '' : 'unread',
            key: notification.id,
            id: notification.id,
          },
          null,
          () => app.user.notifications.markAsRead(notifications),
          () => setTimeout(() => {
            const el = document.getElementById("highlighted")
            if (el) el.scrollIntoView({behavior: "smooth"})
          }, 200)
        );
    }
    else {
      const notificationData = notifications.map((notif) =>
        typeof notif.data === 'string' ? JSON.parse(notif.data) : notif.data
      );
      let {
        authorInfo,
        createdAt,
        notificationHeader,
        notificationBody,
        path,
        pageJump,
      } = getBatchNotificationFields(category, notificationData);

      if (app.isCustomDomain()) {
        if (
          path.indexOf(`https://commonwealth.im/${app.customDomainId()}/`) !==
            0 &&
          path.indexOf(`http://localhost:8080/${app.customDomainId()}/`) !== 0
        )
          return;
        path = path
          .replace(`https://commonwealth.im/${app.customDomainId()}/`, '/')
          .replace(`http://localhost:8080/${app.customDomainId()}/`, '/');
      }

      return link(
        'a.NotificationRow',
        path.replace(/ /g, '%20'),
        [
          authorInfo.length === 1
            ? m(User, {
                user: new AddressInfo(
                  null,
                  (authorInfo[0] as [string, string])[1],
                  (authorInfo[0] as [string, string])[0],
                  null
                ),
                avatarOnly: true,
                avatarSize: 26,
              })
            : m(UserGallery, {
                users: authorInfo.map(
                  (auth) => new AddressInfo(null, auth[1], auth[0], null)
                ),
                avatarSize: 26,
              }),
          m('.comment-body', [
            m('.comment-body-title', notificationHeader),
            notificationBody &&
              category !== `${NotificationCategories.NewReaction}` &&
              category !== `${NotificationCategories.NewThread}` &&
              m('.comment-body-excerpt', notificationBody),
            m('.comment-body-bottom-wrap', [
              m('.comment-body-created', moment(createdAt).fromNow()),
              !notification.isRead &&
                m(
                  '.comment-body-mark-as-read',
                  {
                    onclick: (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      vnode.state.markingRead = true;
                      app.user.notifications
                        .markAsRead(notifications)
                        ?.then(() => {
                          vnode.state.markingRead = false;
                          m.redraw();
                        })
                        .catch(() => {
                          vnode.state.markingRead = false;
                          m.redraw();
                        });
                    },
                  },
                  [
                    vnode.state.markingRead
                      ? m(Spinner, { size: 'xs', active: true })
                      : 'Mark as read',
                  ]
                ),
            ]),
          ]),
        ],
        {
          class: notification.isRead ? '' : 'unread',
          key: notification.id,
          id: notification.id,
        },
        null,
        () => app.user.notifications.markAsRead(notifications),
        pageJump ? () => setTimeout(() => pageJump(), 1) : null
      );
    }
  },
};

export default NotificationRow;
