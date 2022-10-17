import WebSocket from 'ws';
import Sequelize, { DataTypes, QueryTypes } from 'sequelize';
import { ChainBase, ChainType } from 'common-common/src/types';
import { factory, formatFilename } from 'common-common/src/logging';
import send, { WebhookContent } from '../webhookNotifier';
import { SERVER_URL } from '../config';
import { UserAttributes } from './user';
import { DB } from '../models';
import { NotificationCategoryAttributes } from './notification_category';
import { ModelStatic } from './types';
import {
  IPostNotificationData,
  ICommunityNotificationData,
  IChainEventNotificationData,
  IChatNotification,
} from '../../shared/types';
import {
  createImmediateNotificationEmailObject,
  sendImmediateNotificationEmail,
} from '../scripts/emails';
import { ChainAttributes } from './chain';
import { ThreadAttributes } from './thread';
import { CommentAttributes } from './comment';
import {
  NotificationsReadAttributes,
  NotificationsReadInstance,
} from './notifications_read';
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
  Chain?: ChainAttributes;
  Thread?: ThreadAttributes;
  Comment?: CommentAttributes;
}

export interface SubscriptionInstance
extends Sequelize.Model<SubscriptionAttributes>, SubscriptionAttributes {
  getNotificationsRead: Sequelize.HasManyGetAssociationsMixin<NotificationsReadInstance>;
}

export type SubscriptionModelStatic = ModelStatic<SubscriptionInstance> & { emitNotifications?: (
  models: DB,
  category_id: string,
  object_id: string,
  notification_data: IPostNotificationData | ICommunityNotificationData | IChainEventNotificationData | IChatNotification,
  webhook_data?: Partial<WebhookContent>,
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
      chain_id: { type: dataTypes.STRING, allowNull: true },
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
        { fields: ['offchain_thread_id'] },
      ],
    }
  );

  Subscription.emitNotifications = async (
    models: DB,
    category_id: string,
    object_id: string,
    notification_data: IPostNotificationData | ICommunityNotificationData | IChainEventNotificationData | IChatNotification,
    webhook_data?: WebhookContent,
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
    const subscriptions = await models.Subscription.findAll({
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
      if (isChainEventData) {
        const event: any = (<IChainEventNotificationData>notification_data).chainEvent;
        event.ChainEventType = (<IChainEventNotificationData>notification_data).chainEventType;

        notification = await models.Notification.create({
          notification_data: JSON.stringify(event),
          chain_event_id: (<IChainEventNotificationData>notification_data).chainEvent.id,
          category_id: 'chain-event',
          chain_id: (<IChainEventNotificationData>notification_data).chain_id
        })
      } else {
        notification = await models.Notification.create({
          notification_data: JSON.stringify(notification_data),
          category_id,
          chain_id: (<IPostNotificationData>notification_data).chain_id
            || (<ICommunityNotificationData>notification_data).chain
            || (<IChatNotification>notification_data).chain_id
        });
      }
    }

    let msg;
    try {
      msg = await createImmediateNotificationEmailObject(notification_data, category_id, models);
    } catch (e) {
      console.log('Error generating immediate notification email!');
      console.trace(e);
    }

    // create NotificationsRead instances
    // await models.NotificationsRead.bulkCreate(subscribers.map((subscription) => ({
    //   subscription_id: subscription.id,
    //   notification_id: notification.id,
    //   is_read: false,
    //   user_id: subscription.subscriber_id
    // })));

    let query = `INSERT INTO "NotificationsRead" VALUES `;
    const replacements = [];
    for (const subscription of subscriptions) {
      if (subscription.subscriber_id) {
        query += `(?, ?, ?, ?, (SELECT COALESCE(MAX(id), 0) + 1 FROM "NotificationsRead" WHERE user_id = ?)), `
        replacements.push(notification.id, subscription.id, false, subscription.subscriber_id, subscription.subscriber_id);
      } else {
        // TODO: rollbar reported issue originates from here
        log.info(`Subscription: ${JSON.stringify(subscription.toJSON())}\nNotification_data: ${JSON.stringify(notification_data)}`);
      }
    }
    if (replacements.length > 0) {
      query = query.slice(0, -2) + ';';
      await models.sequelize.query(query, { replacements, type: QueryTypes.INSERT });
    }

    // send emails
    for (const subscription of subscriptions) {
      if (msg && isChainEventData && (<IChainEventNotificationData>notification_data).chainEventType?.chain) {
        msg.dynamic_template_data.notification.path = `${
          SERVER_URL
        }/${
          (<IChainEventNotificationData>notification_data).chainEventType.chain
        }/notifications?id=${
          notification.id
        }`;
      }
      if (msg && subscription?.immediate_email && subscription?.User) {
        // kick off async call and immediately return
        sendImmediateNotificationEmail(subscription.User, msg);
      }
    }

    const erc20Tokens = (await models.Chain.findAll({
      where: {
        base: ChainBase.Ethereum,
        type: ChainType.Token,
      }
    })).map((o) => o.id);

    // send data to relevant webhooks
    if (webhook_data && (
      // TODO: this OR clause seems redundant?
      webhook_data.chainEventType?.chain || !erc20Tokens.includes(webhook_data.chainEventType?.chain)
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
    models.Subscription.belongsTo(models.Chain, { foreignKey: 'chain_id', targetKey: 'id' });
    models.Subscription.belongsTo(models.Thread, { foreignKey: 'offchain_thread_id', targetKey: 'id' });
    models.Subscription.belongsTo(models.ChainEventType, { foreignKey: 'chain_event_type_id', targetKey: 'id' });
    models.Subscription.belongsTo(models.ChainEntityMeta, { foreignKey: 'chain_entity_id', targetKey: 'id' });
    models.Subscription.belongsTo(models.Comment, { foreignKey: 'offchain_comment_id', targetKey: 'id'});
  };

  return Subscription;
};
