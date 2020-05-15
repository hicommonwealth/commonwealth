import _ from 'underscore';
import WebSocket from 'ws';
import Sequelize from 'sequelize';
import send, { WebhookContent } from '../webhookNotifier';
import {
  WebsocketMessageType, IWebsocketsPayload,
  IPostNotificationData, ICommunityNotificationData, IChainEventNotificationData
} from '../../shared/types';

const { Op } = Sequelize;
import { factory, formatFilename } from '../../shared/logging';
const log = factory.getLogger(formatFilename(__filename));

module.exports = (sequelize, DataTypes) => {
  const Subscription = sequelize.define('Subscription', {
    subscriber_id: { type: DataTypes.INTEGER, allowNull: false },
    category_id: { type: DataTypes.STRING, allowNull: false },
    object_id: { type: DataTypes.STRING, allowNull: false },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true, allowNull: false },
  }, {
    underscored: true,
    paranoid: true,
    indexes: [
      { fields: ['subscriber_id'] },
      { fields: ['category_id', 'object_id', 'is_active'] },
    ],
  });

  Subscription.associate = (models) => {
    models.Subscription.belongsTo(models.User, { foreignKey: 'subscriber_id', targetKey: 'id' });
    models.Subscription.belongsTo(models.NotificationCategory, { foreignKey: 'category_id', targetKey: 'name' });
    models.Subscription.hasMany(models.Notification);
  };

  Subscription.emitNotifications = async (
    models,
    category_id: string,
    object_id: string,
    notification_data: IPostNotificationData | ICommunityNotificationData | IChainEventNotificationData,
    webhook_data?: WebhookContent,
    wss?: WebSocket.Server,
    excludeAddresses?: string[],
    includeAddresses?: string[],
  ) => {
    // get subscribers to send notifications to
    const findOptions: any = {
      [Op.and]: [
        { category_id },
        { object_id },
        { is_active: true },
      ],
    };

    // typeguard function to differentiate between chain event notifications as needed
    const isChainEventData = (
      n: IPostNotificationData | ICommunityNotificationData | IChainEventNotificationData
    ): n is IChainEventNotificationData => {
      return (n as IChainEventNotificationData).chainEvent !== undefined;
    };

    const fetchUsersFromAddresses = async (addresses: string[]): Promise<number[]> => {
      // fetch user ids from address models
      const addressModels = await models.Address.findAll({
        where: {
          address: {
            [Op.in]: addresses,
          },
        },
      });
      if (addressModels && addressModels.length > 0) {
        const userIds = addressModels.map((a) => a.user_id);

        // remove duplicates
        const userIdsDedup = userIds.filter((a, b) => userIds.indexOf(a) === b);
        return userIdsDedup;
      } else {
        return [];
      }
    };

    // currently excludes override includes, but we may want to provide the option for both
    if (excludeAddresses && excludeAddresses.length > 0) {
      const ids = await fetchUsersFromAddresses(excludeAddresses);
      if (ids && ids.length > 0) {
        findOptions[Op.and].push({ subscriber_id: { [Op.notIn]: ids } });
      }
    } else if (includeAddresses && includeAddresses.length > 0) {
      const ids = await fetchUsersFromAddresses(includeAddresses);
      if (ids && ids.length > 0) {
        findOptions[Op.and].push({ subscriber_id: { [Op.in]: ids } });
      }
    }

    const subscribers = await models.Subscription.findAll({ where: findOptions });

    // create notifications (data should always exist, but we check anyway)
    if (!notification_data) return [];
    const notifications: any[] = await Promise.all(subscribers.map(async (subscription) => {
      const notificationObj: any = {
        subscription_id: subscription.id,
      };
      if (isChainEventData(notification_data)) {
        notificationObj.notification_data = '';
        notificationObj.chain_event_id = notification_data.chainEvent.id;
      } else {
        notificationObj.notification_data = JSON.stringify(notification_data);
      }
      const notification = await models.Notification.create(notificationObj);
      return notification;
    }));

    // send data to relevant webhooks
    if (webhook_data) {
      await send(models, {
        notificationCategory: category_id,
        ...webhook_data
      });
    }

    // send websocket state updates
    const created_at = new Date();
    if (wss) {
      const payload: IWebsocketsPayload<any> = {
        event: WebsocketMessageType.Notification,
        data: {
          topic: category_id,
          object_id,
          created_at,
        }
      };
      if (isChainEventData(notification_data)) {
        payload.data.notification_data = {};
        payload.data.ChainEvent = notification_data.chainEvent.toJSON();
        payload.data.ChainEvent.ChainEventType = notification_data.chainEventType.toJSON();
      } else {
        payload.data.notification_data = notification_data;
      }
      const subscriberIds: number[] = subscribers.map((s) => s.subscriber_id);
      const userNotificationMap = _.object(subscriberIds, notifications);
      wss.emit(WebsocketMessageType.Notification, payload, userNotificationMap);
    }
    return notifications;
  };

  return Subscription;
};
