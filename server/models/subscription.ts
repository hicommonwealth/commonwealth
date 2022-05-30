import WebSocket from 'ws';
import Sequelize, { DataTypes } from 'sequelize';
import send, { WebhookContent } from '../webhookNotifier';
import { SERVER_URL } from '../config';
import { UserAttributes } from './user';
import { DB } from '../database';
import { NotificationCategoryAttributes } from './notification_category';
import { ModelStatic } from './types';
import {
  IPostNotificationData, ICommunityNotificationData, IChainEventNotificationData, ChainBase, ChainType,
} from '../../shared/types';
import { createImmediateNotificationEmailObject, sendImmediateNotificationEmail } from '../scripts/emails';
import { factory, formatFilename } from '../../shared/logging';
import { CommunityAttributes } from './community';
import { ThreadAttributes } from './thread';
import { CommentAttributes } from './comment';
import { ChainEventTypeAttributes } from './chain_event_type';
import { ChainEntityAttributes } from './chain_entity';
import { NotificationsReadAttributes, NotificationsReadInstance } from './notifications_read';
import { NotificationInstance } from './notification';

const log = factory.getLogger(formatFilename(__filename));

const { Op } = Sequelize;

export type SubscriptionAttributes = {
  subscriber_id: number;
  category_id: string;
  object_id: string;
  id?: number;
  is_active?: boolean;
  immediate_email?: boolean;
  created_at?: Date;
  updated_at?: Date;
  chain_id?: string;
  offchain_thread_id?: number;
  offchain_comment_id?: number;
  chain_event_type_id?: string;
  chain_entity_id?: number;

  User?: UserAttributes;
  NotificationCategory?: NotificationCategoryAttributes;
  NotificationsRead?: NotificationsReadAttributes[];
  Community?: CommunityAttributes;
  Thread?: ThreadAttributes;
  Comment?: CommentAttributes;
  ChainEventType?: ChainEventTypeAttributes;
  ChainEntity?: ChainEntityAttributes;
}

export interface SubscriptionInstance
extends Sequelize.Model<SubscriptionAttributes>, SubscriptionAttributes {
  getNotificationsRead: Sequelize.HasManyGetAssociationsMixin<NotificationsReadInstance>;
}

export type SubscriptionModelStatic = ModelStatic<SubscriptionInstance> & { emitNotifications?: (
  models: DB,
  category_id: string,
  object_id: string,
  notification_data: IPostNotificationData | ICommunityNotificationData | IChainEventNotificationData,
  webhook_data?: Partial<WebhookContent>,
  wss?: WebSocket.Server,
  excludeAddresses?: string[],
  includeAddresses?: string[],
) => Promise<NotificationInstance> };

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
      // TODO: change allowNull to false once subscription refactor is implemented
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
    models: DB,
    category_id: string,
    object_id: string,
    notification_data: IPostNotificationData | ICommunityNotificationData | IChainEventNotificationData,
    webhook_data?: WebhookContent,
    wss?: WebSocket.Server,
    excludeAddresses?: string[],
    includeAddresses?: string[],
  ): Promise<NotificationInstance> => {
    // get subscribers to send notifications to
    const findOptions: any = {
      [Op.and]: [
        { category_id },
        { object_id },
        { is_active: true },
      ],
    };

    // typeguard function to differentiate between chain event notifications as needed
    const isChainEventData = (<IChainEventNotificationData>notification_data).chainEvent !== undefined

    // retrieve distinct user ids given a set of addresses
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

    // get all relevant subscriptions
    const subscribers = await models.Subscription.findAll({
      where: findOptions,
      include: models.User,
    });

    // get notification if it already exists
    let notification: NotificationInstance;
    notification = await models.Notification.findOne(isChainEventData ? {
      where: {
        chain_event_id: (<IChainEventNotificationData>notification_data).chainEvent.id
      }
    } : {
      where: {
        notification_data: JSON.stringify(notification_data)
      }
    });

    // if the notification does not yet exist create it here
    if (!notification) {
      notification = await models.Notification.create(isChainEventData ? {
        notification_data: '',
        chain_event_id: (<IChainEventNotificationData>notification_data).chainEvent.id,
        category_id: 'chain-event',
        community_id: (<IChainEventNotificationData>notification_data).community_id
      } : {
        notification_data: JSON.stringify(notification_data),
        category_id,
        community_id: (<IPostNotificationData>notification_data).community_id
          || (<ICommunityNotificationData>notification_data).community_id
      })
    }

    let msg;
    try {
      msg = await createImmediateNotificationEmailObject(notification_data, category_id, models);
    } catch (e) {
      console.log('Error generating immediate notification email!');
      console.trace(e);
    }

    // create NotificationsRead instances
    await models.NotificationsRead.bulkCreate(subscribers.map((subscription) => ({
      subscription_id: subscription.id,
      notification_id: notification.id,
      is_read: false
    })));

    // send emails
    for (const subscription of subscribers) {
      if (msg && isChainEventData && (<IChainEventNotificationData>notification_data).chainEventType?.community_id) {
        msg.dynamic_template_data.notification.path = `${
          SERVER_URL
        }/${
          (<IChainEventNotificationData>notification_data).chainEventType.community_id
        }/notifications?id=${
          notification.id
        }`;
      }
      if (msg && subscription?.immediate_email && subscription?.User) {
        // kick off async call and immediately return
        sendImmediateNotificationEmail(subscription.User, msg);
      }
    }

    const erc20Tokens = (await models.Community.findAll({
      where: {
        base: ChainBase.Ethereum,
        type: ChainType.Token,
      }
    })).map((o) => o.id);

    // send data to relevant webhooks
    if (webhook_data && (
      // TODO: this OR clause seems redundant?
      webhook_data.chainEventType?.community_id || !erc20Tokens.includes(webhook_data.chainEventType?.community_id)
    )) {
      await send(models, {
        notificationCategory: category_id,
        ...webhook_data
      });
    }

    return notification;
  };

  Subscription.associate = (models) => {
    models.Subscription.belongsTo(models.User, { foreignKey: 'subscriber_id', targetKey: 'id' });
    models.Subscription.belongsTo(models.NotificationCategory, { foreignKey: 'category_id', targetKey: 'name' });
    models.Subscription.hasMany(models.NotificationsRead, { foreignKey: 'subscription_id', onDelete: 'cascade' });
    models.Subscription.belongsTo(models.Community, { foreignKey: 'community_id', targetKey: 'id' });
    models.Subscription.belongsTo(models.Thread, { foreignKey: 'offchain_thread_id', targetKey: 'id' });
    models.Subscription.belongsTo(models.Comment, { foreignKey: 'offchain_comment_id', targetKey: 'id' });
    models.Subscription.belongsTo(models.ChainEventType, { foreignKey: 'chain_event_type_id', targetKey: 'id' });
    models.Subscription.belongsTo(models.ChainEntity, { foreignKey: 'chain_entity_id', targetKey: 'id' });
  };

  return Subscription;
};
