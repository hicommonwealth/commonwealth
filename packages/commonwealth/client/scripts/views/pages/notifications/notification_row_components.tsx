import React, { useState } from 'react';
import moment from 'moment';

import 'pages/notifications/notification_row.scss';
import AddressInfo from '../../../models/AddressInfo';

import type { NotificationRowProps } from './notification_row';
import { Label as ChainEventLabel } from 'chain-events/src';
import type { CWEvent } from 'chain-events/src';
import { NotificationCategories } from 'common-common/src/types';

import app from 'state';
import { CWIconButton } from '../../components/component_kit/cw_icon_button';
import { getClasses } from '../../components/component_kit/helpers';
import { User } from 'views/components/user/user';
import { CWSpinner } from '../../components/component_kit/cw_spinner';
import { getBatchNotificationFields } from './helpers';
import { UserGallery } from '../../components/user/user_gallery';
import { useCommonNavigate } from 'navigation/helpers';
import { useNavigate } from 'react-router';

export const ChainEventNotificationRow = (
  props: Omit<NotificationRowProps, 'allRead'>
) => {
  const { notification, onListPage } = props;

  const navigate = useCommonNavigate();

  if (!notification.chainEvent) {
    throw new Error('chain event notification does not have expected data');
  }

  const chainId = notification.chainEvent.chain;

  if (app.isCustomDomain() && chainId !== app.customDomainId()) {
    return;
  }

  const chainEvent: CWEvent = {
    blockNumber: notification.chainEvent.blockNumber,
    network: notification.chainEvent.network,
    data: notification.chainEvent.data,
  };

  const chainName = app.config.chains.getById(chainId)?.name;

  const label = ChainEventLabel(chainId, chainEvent);

  if (!label) {
    return (
      <div
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
      </div>
    );
  }

  return (
    <div
      className={
        !notification.isRead ? 'NotificationRow unread' : 'NotificationRow'
      }
      onClick={() => navigate(`/notifications?id=${notification.id}`)}
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
  allRead: boolean;
};

export const DefaultNotificationRow = (props: ExtendedNotificationRowProps) => {
  const { handleSetMarkingRead, markingRead, notification, allRead } = props;
  const [isRead, setIsRead] = useState<boolean>(notification.isRead);

  const { category } = notification.subscription;

  const navigate = useNavigate();

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
  } else {
    path = path
      .replace(`https://commonwealth.im/`, '/')
      .replace(`http://localhost:8080/`, '/');
  }

  return (
    <div
      className={
        !isRead && !allRead ? 'NotificationRow unread' : 'NotificationRow'
      }
      onClick={() => navigate(path.replace(/ /g, '%20'))}
    >
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
          category !== NotificationCategories.NewReaction &&
          category !== NotificationCategories.NewThread && (
            <div className="comment-body-excerpt">{notificationBody}</div>
          )}
        <div className="comment-body-bottom-wrap">
          <div className="comment-body-created">
            {moment(createdAt).fromNow()}
          </div>
          {!isRead && !allRead && (
            <div
              className="comment-body-mark-as-read"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();

                handleSetMarkingRead(true);

                app.user.notifications
                  .markAsRead([notification])
                  ?.then(() => {
                    setIsRead(true);
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

export const SnapshotNotificationRow = (
  props: ExtendedNotificationRowProps
) => {
  const { handleSetMarkingRead, markingRead, notification, allRead } = props;
  const [isRead, setIsRead] = useState<boolean>(notification.isRead);
  const navigate = useNavigate();

  const notificationData = JSON.parse(notification.data);
  const header = `Update in Snapshot Space: ${notificationData.space}`;
  let body = '';

  switch (notificationData.eventType) {
    case 'proposal/created':
      body = `New proposal created: ${notificationData.title}`;
      break;
    case 'proposal/end':
      body = `Proposal ended: ${notificationData.title}`;
      break;
    case 'proposal/deleted':
      body = `Proposal deleted: ${notificationData.title}`;
      break;
    case 'proposal/start':
      body = `Proposal started: ${notificationData.title}`;
      break;
    default:
      break;
  }

  return (
    <div
      className={
        !isRead && !allRead ? 'NotificationRow unread' : 'NotificationRow'
      }
      onClick={() =>
        navigate(`/snapshot/${notificationData.space}/${notificationData.id}`)
      }
    >
      <div className="comment-body">
        <div className="comment-body-title">{header}</div>
        <div className="comment-body-excerpt">{body}</div>
        <div className="comment-body-bottom-wrap">
          {!isRead && (
            <div
              className="comment-body-mark-as-read"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();

                handleSetMarkingRead(true);

                app.user.notifications
                  .markAsRead([notification])
                  ?.then(() => {
                    setIsRead(true);
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
