import {
  NotificationCategories,
  ProposalType,
  SupportedNetwork,
} from '@hicommonwealth/core';
import { getProposalUrlPath } from 'identifiers';
import moment from 'moment';
import { useCommonNavigate } from 'navigation/helpers';
import 'pages/notifications/notification_row.scss';
import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import app from 'state';
import { User } from 'views/components/user/user';
import type { IEventLabel } from '../../../../../shared/chain/labelers/util';
import { Label as ChainEventLabel } from '../../../../../shared/chain/labelers/util';
import type { CWEvent } from '../../../../../shared/chain/types/types';
import AddressInfo from '../../../models/AddressInfo';
import { CWIconButton } from '../../components/component_kit/cw_icon_button';
import { getClasses } from '../../components/component_kit/helpers';
import CWCircleMultiplySpinner from '../../components/component_kit/new_designs/CWCircleMultiplySpinner';
import { UserGallery } from '../../components/user/user_gallery';
import { getBatchNotificationFields } from './helpers';
import type { NotificationRowProps } from './notification_row';

export const ChainEventNotificationRow = (
  props: Omit<NotificationRowProps, 'allRead'>,
) => {
  const { notification, onListPage } = props;

  const navigate = useCommonNavigate();

  if (!notification.chainEvent) {
    throw new Error('chain event notification does not have expected data');
  }

  const communityId = notification.chainEvent.chain;

  if (app.isCustomDomain() && communityId !== app.customDomainId()) {
    return;
  }

  const chainEvent: CWEvent = {
    blockNumber: notification.chainEvent.blockNumber,
    network: notification.chainEvent.network,
    data: notification.chainEvent.data,
  };

  const communityName = app.config.chains.getById(communityId)?.name;

  let label: IEventLabel | undefined;
  try {
    label = ChainEventLabel(communityId, chainEvent);
  } catch (e) {
    console.warn(e);
    return;
  }

  if (!label) {
    return (
      <div
        className={getClasses<{ isUnread?: boolean }>(
          { isUnread: !notification.isRead },
          'NotificationRow',
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

  let proposalType: ProposalType;
  if (chainEvent.network === SupportedNetwork.Cosmos) {
    proposalType = ProposalType.CosmosProposal;
  } else if (chainEvent.network === SupportedNetwork.Aave) {
    proposalType = ProposalType.AaveProposal;
  } else if (chainEvent.network === SupportedNetwork.Compound) {
    proposalType = ProposalType.CompoundProposal;
  }

  if (!proposalType) {
    return;
  }

  const path = getProposalUrlPath(
    proposalType,
    (chainEvent.data as any).id,
    false,
    communityId,
  );

  return (
    <div
      className={
        !notification.isRead ? 'NotificationRow unread' : 'NotificationRow'
      }
      onClick={() => navigate(path, {}, null)}
    >
      <div className="comment-body">
        <div className="comment-body-top chain-event-notification-top">
          {label.heading} on {communityName}
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
        {!notification.chainEvent.blockNumber ? null : (
          <div className="comment-body-bottom">
            Block {notification.chainEvent.blockNumber}
          </div>
        )}
      </div>
    </div>
  );
};

type ExtendedNotificationRowProps = NotificationRowProps & {
  handleSetMarkingRead: (isMarkingRead: boolean) => void;
  markingRead: boolean;
  allRead: boolean;
};

// eslint-disable-next-line react/no-multi-comp
export const DefaultNotificationRow = (props: ExtendedNotificationRowProps) => {
  const { handleSetMarkingRead, markingRead, notification, allRead } = props;
  const [isRead, setIsRead] = useState<boolean>(notification.isRead);

  const category = notification.categoryId;

  const navigate = useNavigate();

  const notificationData = [notification].map((notif) =>
    typeof notif.data === 'string' ? JSON.parse(notif.data) : notif.data,
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
          userAddress={(authorInfo[0] as [string, string])[1]}
          userCommunityId={(authorInfo[0] as [string, string])[0]}
          shouldShowAvatarOnly
          avatarSize={26}
        />
      ) : (
        <UserGallery
          users={authorInfo.map(
            (auth) =>
              new AddressInfo({
                id: null,
                address: auth[1],
                communityId: auth[0],
              }),
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
              {markingRead ? (
                <CWCircleMultiplySpinner center={false} />
              ) : (
                'Mark as read'
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// eslint-disable-next-line react/no-multi-comp
export const SnapshotNotificationRow = (
  props: ExtendedNotificationRowProps,
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
              {markingRead ? (
                <CWCircleMultiplySpinner center={false} />
              ) : (
                'Mark as read'
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
