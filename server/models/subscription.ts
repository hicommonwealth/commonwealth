import WebSocket from 'ws';
import Sequelize, { DataTypes } from 'sequelize';
import send, { WebhookContent } from '../webhookNotifier';
import { SERVER_URL } from '../config';
import { UserAttributes } from './user';
import { NotificationCategoryAttributes } from './notification_category';
import {NotificationAttributes, NotificationInstance} from './notification';
import { ModelStatic } from './types';
import {
  IPostNotificationData, ICommunityNotificationData, IChainEventNotificationData,
} from '../../shared/types';
import { createImmediateNotificationEmailObject, sendImmediateNotificationEmail } from '../scripts/emails';
import { factory, formatFilename } from '../../shared/logging';
import { ChainAttributes } from './chain';
import { OffchainCommunityAttributes } from './offchain_community';
import { OffchainThreadAttributes } from './offchain_thread';
import { OffchainCommentAttributes } from './offchain_comment';
import { ChainEventTypeAttributes } from './chain_event_type';
import { ChainEntityAttributes } from './chain_entity';

const log = factory.getLogger(formatFilename(__filename));

const { Op } = Sequelize;

export interface SubscriptionAttributes {
  subscriber_id: number;
  category_id: string;
  object_id: string;
  id?: number;
  is_active?: boolean;
  immediate_email?: boolean;
  created_at?: Date;
  updated_at?: Date;
  chain_id?: string;
  community_id?: string;
  offchain_thread_id?: number;
  offchain_comment_id?: number;
  chain_event_type_id?: string;
  chain_entity_id?: number;

  User?: UserAttributes;
  NotificationCategory?: NotificationCategoryAttributes;
  Notifications?: NotificationAttributes[];
  Chain?: ChainAttributes;
  OffchainCommunity?: OffchainCommunityAttributes;
  OffchainThread?: OffchainThreadAttributes;
  OffchainComment?: OffchainCommentAttributes;
  ChainEventType?: ChainEventTypeAttributes;
  ChainEntity?: ChainEntityAttributes;
}

export interface SubscriptionInstance
extends Sequelize.Model<SubscriptionAttributes>, SubscriptionAttributes {
  getNotifications: Sequelize.HasManyGetAssociationsMixin<NotificationInstance>;
}

export type SubscriptionModelStatic = ModelStatic<SubscriptionInstance> & { emitNotifications?: any; }

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes,
): SubscriptionModelStatic => {
  const Subscription = <SubscriptionModelStatic>sequelize.define(
    'Subscription', {
      id: { type: dataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      subscriber_id: { type: dataTypes.INTEGER, allowNull: false },
      category_id: { type: dataTypes.STRING, allowNull: false },
      object_id: { type: dataTypes.STRING, allowNull: false },
      is_active: { type: dataTypes.BOOLEAN, defaultValue: true, allowNull: false },
      immediate_email: { type: dataTypes.BOOLEAN, defaultValue: false, allowNull: false },
      chain_id: { type: dataTypes.STRING, allowNull: true },
      community_id: { type: dataTypes.STRING, allowNull: true },
      offchain_thread_id: { type: dataTypes.INTEGER, allowNull: true },
      offchain_comment_id: { type: dataTypes.INTEGER, allowNull: true },
      chain_event_type_id: { type: dataTypes.STRING, allowNull: true },
      chain_entity_id: { type: dataTypes.INTEGER, allowNull: true },
    }, {
      tableName: 'Subscriptions',
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        { fields: ['subscriber_id'] },
        { fields: ['category_id', 'object_id', 'is_active'] },
      ],
    }
  );

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
    if (!notification_data) {
      log.info('Subscription is missing notification data, will not trigger send emails or webhooks');
      return [];
    }

    let msg;
    try {
      msg = await createImmediateNotificationEmailObject(notification_data, category_id, models);
    } catch (e) {
      console.log('Error generating immediate notification email!');
      console.trace(e);
    }

    const notifications = await Promise.all(subscribers.map(async (subscription) => {
      const notification = await models.Notification.create(
        isChainEventData(notification_data)
          ? {
            subscription_id: subscription.id,
            notification_data: '',
            chain_event_id: notification_data.chainEvent.id
          } : {
            subscription_id: subscription.id,
            notification_data: JSON.stringify(notification_data)
          }
      );
      if (msg && isChainEventData(notification_data)) {
        msg.dynamic_template_data.notification.path = `${SERVER_URL}/${notification_data.chainEventType.chain}/notificationsList?id=${notification.id}`;
      }
      if (msg && subscription.immediate_email) sendImmediateNotificationEmail(subscription, msg);
      return notification;
    }));

    const erc20Tokens = (await models.Chain.findAll({
      where: {
        base: 'ethereum',
        type: 'token'
      }
    })).map(o => o.id)

    // send data to relevant webhooks
    // TODO: currently skipping all erc20 events from webhooks - change?
    // @ts-ignore
    if (webhook_data && !erc20Tokens.includes(webhook_data.chainEventType.chain)) {
      await send(models, {
        notificationCategory: category_id,
        ...webhook_data
      });
    }

    // // send websocket state updates
    // // TODO: debug and figure out why this may fail and prevent calls from returning
    // const created_at = new Date();
    // if (wss) {
    //   const payload: IWebsocketsPayload<any> = {
    //     event: WebsocketMessageType.Notification,
    //     data: {
    //       topic: category_id,
    //       object_id,
    //       created_at,
    //     }
    //   };
    //   if (isChainEventData(notification_data)) {
    //     payload.data.notification_data = {};
    //     payload.data.ChainEvent = notification_data.chainEvent.toJSON();
    //     payload.data.ChainEvent.ChainEventType = notification_data.chainEventType.toJSON();
    //   } else {
    //     payload.data.notification_data = notification_data;
    //   }
    //   const subscriberIds: number[] = subscribers.map((s) => s.subscriber_id);
    //   const userNotificationMap = _.object(subscriberIds, notifications);
    //   wss.emit(WebsocketMessageType.Notification, payload, userNotificationMap);
    // }

    return notifications;
  };

  Subscription.associate = (models) => {
    models.Subscription.belongsTo(models.User, { foreignKey: 'subscriber_id', targetKey: 'id' });
    models.Subscription.belongsTo(models.NotificationCategory, { foreignKey: 'category_id', targetKey: 'name' });
    models.Subscription.hasMany(models.Notification, { onDelete: 'cascade' });
    models.Subscription.belongsTo(models.Chain, { foreignKey: 'chain_id', targetKey: 'id' });
    models.Subscription.belongsTo(models.OffchainCommunity, { foreignKey: 'community_id', targetKey: 'id' });
    models.Subscription.belongsTo(models.OffchainThread, { foreignKey: 'offchain_thread_id', targetKey: 'id' });
    models.Subscription.belongsTo(models.OffchainComment, { foreignKey: 'offchain_comment_id', targetKey: 'id' });
    models.Subscription.belongsTo(models.ChainEventType, { foreignKey: 'chain_event_type_id', targetKey: 'id' });
    models.Subscription.belongsTo(models.ChainEntity, { foreignKey: 'chain_entity_id', targetKey: 'id' });
  };

  return Subscription;
};
