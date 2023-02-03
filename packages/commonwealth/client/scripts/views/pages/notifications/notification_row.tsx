/* @jsx jsx */
import React from 'react';

import {
  ClassComponent,
  ResultNode,
  getRouteParam,
  redraw,
  jsx,
} from 'mithrilInterop';
import moment from 'moment';
import { CWEvent, Label as ChainEventLabel } from 'chain-events/src';

import 'pages/notifications/notification_row.scss';

import app from 'state';
import { navigateToSubpage } from 'router';
import { NotificationCategories } from 'common-common/src/types';
import { Notification, AddressInfo } from 'models';
import { link } from 'helpers';
import { User } from 'views/components/user/user';
import { UserGallery } from 'views/components/user/user_gallery';
import { getBatchNotificationFields } from './helpers';
import { CWIconButton } from '../../components/component_kit/cw_icon_button';
import { CWSpinner } from '../../components/component_kit/cw_spinner';
import { getClasses } from '../../components/component_kit/helpers';

type NotificationRowAttrs = {
  notifications: Array<Notification>;
  onListPage?: boolean;
};

export class NotificationRow extends ClassComponent<NotificationRowAttrs> {
  private markingRead: boolean;
  private scrollOrStop: boolean;

  oncreate(vnode: ResultNode<NotificationRowAttrs>) {
    if (
      getRouteParam('id') &&
      vnode.attrs.onListPage &&
      getRouteParam('id') === vnode.attrs.notifications[0].id.toString()
    ) {
      this.scrollOrStop = true;
    }
  }

  view(vnode: ResultNode<NotificationRowAttrs>) {
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
          const el = document.getElementById(getRouteParam('id'));
          if (el) el.scrollIntoView();
        }, 1);

        this.scrollOrStop = false;
      }

      if (!label) {
        return (
          <li
            className={getClasses<{ isUnread?: boolean }>(
              { isUnread: !notification.isRead },
              'NotificationRow'
            )}
            key={notification.id}
            id={notification.id.toString()}
          >
            <div className="comment-body">
              <div className="comment-body-top">Loading...</div>
            </div>
          </li>
        );
      }

      // link(
      //   'a.NotificationRow',
      //   `/notifications?id=${notification.id}`,

      return (
        <div
          onClick={() =>
            navigateToSubpage(`/notifications?id=${notification.id}`)
          }
        >
          <div className="comment-body">
            <div className="comment-body-top chain-event-notification-top">
              {label.heading} on {chainName}
              {!vnode.attrs.onListPage && (
                <CWIconButton
                  iconName="close"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.scrollOrStop = true;
                    app.user.notifications.delete([notification]).then(() => {
                      redraw();
                    });
                  }}
                />
              )}
            </div>
            <div className="comment-body-bottom">
              Block {notification.chainEvent.blockNumber}
            </div>
            {/* <div className="comment-body-excerpt">{label.label}</div> */}
          </div>
        </div>
      );
      // {
      //   class: notification.isRead ? '' : 'unread',
      //   key: notification.id,
      //   id: notification.id,
      // },
      // null,
      // () => {
      //   if (this.scrollOrStop) {
      //     this.scrollOrStop = false;
      //     return;
      //   }
      //   app.user.notifications
      //     .markAsRead([notification])
      //     .then(() => m.redraw());
      // },
      // () => m.redraw.sync()
      // );
    } else if (category === NotificationCategories.NewChatMention) {
      const { chain_id, author_address, created_at, message_id, channel_id } =
        JSON.parse(notification.data);

      const route = app.socket.chatNs.getRouteToMessage(
        channel_id,
        message_id,
        chain_id
      );

      const author = new AddressInfo(null, author_address, chain_id, null);

      const authorName = <User user={author} hideAvatar hideIdentityIcon />;

      // link(
      //   'a.NotificationRow',
      //   route,

      return (
        <div onClick={() => navigateToSubpage(route)}>
          <User user={author} avatarOnly avatarSize={26} />
          <div className="comment-body">
            <div className="comment-body-title">
              {authorName} mentioned you in {chain_id} chat
            </div>
            <div className="comment-body-bottom-wrap">
              <div className="comment-body-created">
                {moment(created_at).fromNow()}
              </div>
              {!notification.isRead && (
                <div
                  className="comment-body-mark-as-read"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.markingRead = true;
                    app.user.notifications
                      .markAsRead(notifications)
                      ?.then(() => {
                        this.markingRead = false;
                        redraw();
                      })
                      .catch(() => {
                        this.markingRead = false;
                        redraw();
                      });
                  }}
                >
                  {this.markingRead ? (
                    <CWSpinner size="small" />
                  ) : (
                    'Mark as read'
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      );
      //   {
      //     class: notification.isRead ? '' : 'unread',
      //     key: notification.id,
      //     id: notification.id,
      //   },
      //   null,
      //   () => app.user.notifications.markAsRead(notifications),
      //   () =>
      //     setTimeout(() => {
      //       const el = document.getElementById('highlighted');
      //       if (el) el.scrollIntoView({ behavior: 'smooth' });
      //     }, 200)
      // );
    } else {
      const notificationData = notifications.map((notif) =>
        typeof notif.data === 'string' ? JSON.parse(notif.data) : notif.data
      );

      let { path } = getBatchNotificationFields(category, notificationData);

      const {
        authorInfo,
        createdAt,
        notificationHeader,
        notificationBody,
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

      // link(
      //   'a.NotificationRow',
      //   path.replace(/ /g, '%20'),

      return (
        <div onClick={() => navigateToSubpage(path.replace(/ /g, '%20'))}>
          {authorInfo.length === 1 ? (
            <User
              user={
                new AddressInfo(
                  null,
                  (authorInfo[0] as [string, string])[1],
                  (authorInfo[0] as [string, string])[0],
                  null
                )
              }
              avatarOnly
              avatarSize={26}
            />
          ) : (
            <UserGallery
              users={authorInfo.map(
                (auth) => new AddressInfo(null, auth[1], auth[0], null)
              )}
              avatarSize={26}
            />
          )}
          <div className="comment-body">
            <div className="comment-body-title">{notificationHeader}</div>
            {notificationBody &&
              category !== `${NotificationCategories.NewReaction}` &&
              category !== `${NotificationCategories.NewThread}` && (
                <div className="comment-body-excerpt">{notificationBody}</div>
              )}
            <div className="comment-body-bottom-wrap">
              <div className="comment-body-created">
                {moment(createdAt).fromNow()}
              </div>
              {!notification.isRead && (
                <div
                  className="comment-body-mark-as-read"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.markingRead = true;
                    app.user.notifications
                      .markAsRead(notifications)
                      ?.then(() => {
                        this.markingRead = false;
                        redraw();
                      })
                      .catch(() => {
                        this.markingRead = false;
                        redraw();
                      });
                  }}
                >
                  {this.markingRead ? (
                    <CWSpinner size="small" />
                  ) : (
                    'Mark as read'
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      );
      //   {
      //     class: notification.isRead ? '' : 'unread',
      //     key: notification.id,
      //     id: notification.id,
      //     onclick: () => {
      //       // Graham TODO 22.10.05: Temporary fix while we wait for full
      //       // conversion of NotificationsMenu to a Popover- and MobileMenu- friendly
      //       // array
      //       app.mobileMenu = null;
      //       m.redraw();
      //     },
      //   },
      //   null,
      //   () => app.user.notifications.markAsRead(notifications),
      //   pageJump ? () => setTimeout(() => pageJump(), 1) : null
      // );
    }
  }
}
