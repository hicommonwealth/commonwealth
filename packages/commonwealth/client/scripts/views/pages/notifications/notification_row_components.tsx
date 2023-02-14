import React from 'react';
import moment from 'moment';

import 'pages/notifications/notification_row.scss';

import type { NotificationRowProps } from './notification_row';
import { Label as ChainEventLabel } from 'chain-events/src';
import type { CWEvent } from 'chain-events/src';
import { AddressInfo } from 'models';
import { NotificationCategories } from 'common-common/src/types';

import app from 'state';
import { navigateToSubpage } from 'router';
import { CWIconButton } from '../../components/component_kit/cw_icon_button';
import { getClasses } from '../../components/component_kit/helpers';
import { User } from 'views/components/user/user';
import { CWSpinner } from '../../components/component_kit/cw_spinner';
import { getBatchNotificationFields } from './helpers';
import { UserGallery } from '../../components/user/user_gallery';

export const ChainEventNotificationRow = (props: NotificationRowProps) => {
  const { notification, onListPage } = props;

  if (!notification.chainEvent) {
    throw new Error('chain event notification does not have expected data');
  }

  const chainId = notification.chainEvent.type.chain;

  const chainEvent: CWEvent = {
    blockNumber: notification.chainEvent.blockNumber,
    network: notification.chainEvent.type.eventNetwork,
    data: notification.chainEvent.data,
  };

  const chainName = app.config.chains.getById(chainId)?.name;

  if (app.isCustomDomain() && chainId !== app.customDomainId()) return;
  const label = ChainEventLabel(chainId, chainEvent);

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

  return (
    <div
      onClick={() => navigateToSubpage(`/notifications?id=${notification.id}`)}
    >
      <div className="comment-body">
        <div className="comment-body-top chain-event-notification-top">
          {label.heading} on {chainName}
          {!onListPage && (
            <CWIconButton
              iconName="close"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                app.user.notifications.delete([notification]);
              }}
            />
          )}
        </div>
        <div className="comment-body-bottom">
          Block {notification.chainEvent.blockNumber}
        </div>
      </div>
    </div>
  );
};

type ExtendedNotificationRowProps = NotificationRowProps & {
  handleSetMarkingRead: (isMarkingRead: boolean) => void;
  markingRead: boolean;
};

export const NewChatMentionNotificationRow = (
  props: ExtendedNotificationRowProps
) => {
  const { handleSetMarkingRead, markingRead, notification } = props;

  const { chain_id, author_address, created_at, message_id, channel_id } =
    JSON.parse(notification.data);

  const route = app.socket.chatNs.getRouteToMessage(
    channel_id,
    message_id,
    chain_id
  );

  const author = new AddressInfo(null, author_address, chain_id, null);

  const authorName = <User user={author} hideAvatar />;
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
                handleSetMarkingRead(true);

                app.user.notifications
                  .markAsRead([notification])
                  ?.then(() => {
                    handleSetMarkingRead(false);
                  })
                  .catch(() => {
                    handleSetMarkingRead(false);
                  });
              }}
            >
              {markingRead ? <CWSpinner size="small" /> : 'Mark as read'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const DefaultNotificationRow = (props: ExtendedNotificationRowProps) => {
  const { handleSetMarkingRead, markingRead, notification } = props;

  const { category } = notification.subscription;

  const notificationData = [notification].map((notif) =>
    typeof notif.data === 'string' ? JSON.parse(notif.data) : notif.data
  );

  const { authorInfo, createdAt, notificationHeader, notificationBody } =
    getBatchNotificationFields(category, notificationData);

  let { path } = getBatchNotificationFields(category, notificationData);

  if (app.isCustomDomain()) {
    if (
      path.indexOf(`https://commonwealth.im/${app.customDomainId()}/`) !== 0 &&
      path.indexOf(`http://localhost:8080/${app.customDomainId()}/`) !== 0
    ) {
      return;
    }

    path = path
      .replace(`https://commonwealth.im/${app.customDomainId()}/`, '/')
      .replace(`http://localhost:8080/${app.customDomainId()}/`, '/');
  }

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

                handleSetMarkingRead(true);

                app.user.notifications
                  .markAsRead([notification])
                  ?.then(() => {
                    handleSetMarkingRead(false);
                  })
                  .catch(() => {
                    handleSetMarkingRead(false);
                  });
              }}
            >
              {markingRead ? <CWSpinner size="small" /> : 'Mark as read'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
