import WebSocket from 'ws';
import Sequelize from 'sequelize';
import send, { WebhookContent } from '../webhookNotifier';
import { ProposalType, WebsocketMessageType } from '../../shared/types';

const { Op } = Sequelize;
import { factory, formatFilename } from '../util/logging';
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

  interface IPostNotificationData {
    created_at: any;
    root_id: number;
    root_title: string;
    root_type: ProposalType;
    comment_id?: number;
    comment_text?: string;
    chain_id: string;
    community_id: string;
    author_address: string;
    author_chain: string;
  }

  interface ICommunityNotificationData {
    created_at: any;
    role_id: string | number;
    author_address: string;
    chain: string;
    community: string;
  }

  Subscription.emitNotifications = async (
    models,
    category_id: string,
    object_id: string,
    notification_data: IPostNotificationData | ICommunityNotificationData,
    webhook_data: WebhookContent,
    wss?: WebSocket.Server,
    excludeAddresses?: string[],
    includeAddresses?: string[],
    chainEventId?: number,
  ) => {
    // get subscribers to send notifications to
    const findOptions: any = {
      [Op.and]: [
        { category_id },
        { object_id },
        { is_active: true },
      ],
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

    // create notifications if data exists
    let notifications = [];
    if (notification_data) {
      notifications = await Promise.all(subscribers.map(async (subscription) => {
        const notificationObj: any = {
          subscription_id: subscription.id,
          notification_data: JSON.stringify(notification_data),
        };
        if (chainEventId) {
          notificationObj.chain_event_id = chainEventId;
        }
        const notification = await models.Notification.create(notificationObj);
        return notification;
      }));
    }

    // send websocket state updates
    if (wss) {
      const data = {
        event: 'server-event',
        topic: category_id,
        object_id,
        ...notification_data,
      };
      wss.emit(WebsocketMessageType.Notification, data, subscribers.map((s) => s.subscriber_id));
    }
    // send data to relevant webhooks
    await send(models, {
      notificationCategory: category_id,
      ...webhook_data
    });
    return notifications;
  };

  return Subscription;
};
