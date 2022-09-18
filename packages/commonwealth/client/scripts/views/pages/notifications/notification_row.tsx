/* @jsx m */

import m from 'mithril';
import { Spinner } from 'construct-ui';
import moment from 'moment';

import 'pages/notifications/notification_row.scss';

import app from 'state';
import { CWEvent, Label as ChainEventLabel } from 'chain-events/src';
import { NotificationCategories } from 'common-common/src/types';
import { Notification, AddressInfo } from 'models';
import { link } from 'helpers';
import User from 'views/components/widgets/user';
import UserGallery from 'views/components/widgets/user_gallery';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';
import { getBatchNotificationFields } from './helpers';

export class NotificationRow
  implements
    m.ClassComponent<{
      notifications: Notification[];
      onListPage?: boolean;
    }>
{
  private markingRead: boolean;
  private scrollOrStop: boolean;

  oncreate(vnode) {
    if (
      m.route.param('id') &&
      vnode.attrs.onListPage &&
      m.route.param('id') === vnode.attrs.notifications[0].id.toString()
    ) {
      this.scrollOrStop = true;
    }
  }

  view(vnode) {
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

      if (this.scrollOrStop) {
        setTimeout(() => {
          const el = document.getElementById(m.route.param('id'));
          if (el) el.scrollIntoView();
        }, 1);

        this.scrollOrStop = false;
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
                    this.scrollOrStop = true;
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
          if (this.scrollOrStop) {
            this.scrollOrStop = false;
            return;
          }
          app.user.notifications
            .markAsRead([notification])
            .then(() => m.redraw());
        },
        () => m.redraw.sync()
      );
    } else if (category === NotificationCategories.NewChatMention) {
      const { chain_id, author_address, created_at, message_id, channel_id } =
        JSON.parse(notification.data);

      const route = app.socket.chatNs.getRouteToMessage(
        channel_id,
        message_id,
        chain_id
      );

      const author = new AddressInfo(null, author_address, chain_id, null);

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
            m(
              '.comment-body-title',
              m('span', [
                authorName,
                ' mentioned you in ',
                m('span.commented-obj', chain_id),
                ' chat ',
              ])
            ),
            m('.comment-body-bottom-wrap', [
              m('.comment-body-created', moment(created_at).fromNow()),
              !notification.isRead &&
                m(
                  '.comment-body-mark-as-read',
                  {
                    onclick: (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      this.markingRead = true;
                      app.user.notifications
                        .markAsRead(notifications)
                        ?.then(() => {
                          this.markingRead = false;
                          m.redraw();
                        })
                        .catch(() => {
                          this.markingRead = false;
                          m.redraw();
                        });
                    },
                  },
                  [
                    this.markingRead
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
        () =>
          setTimeout(() => {
            const el = document.getElementById('highlighted');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }, 200)
      );
    } else {
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
                      this.markingRead = true;
                      app.user.notifications
                        .markAsRead(notifications)
                        ?.then(() => {
                          this.markingRead = false;
                          m.redraw();
                        })
                        .catch(() => {
                          this.markingRead = false;
                          m.redraw();
                        });
                    },
                  },
                  [
                    this.markingRead
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
  }
}
