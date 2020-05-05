import * as Sequelize from 'sequelize';
import WebSocket from 'ws';
import send, { WebhookContent } from '../webhookNotifier';
import { UserAttributes } from './user';
import { NotificationCategoryAttributes } from './notification_category';
import { NotificationAttributes } from './notification';

const { Op } = Sequelize;

export interface SubscriptionAttributes {
  id?: number;
  subscriber_id: number;
  category_id: string;
  object_id: string;
  is_active?: boolean;
  created_at?: Date;
  updated_at?: Date;
  User?: UserAttributes;
  NotificationCategory?: NotificationCategoryAttributes;
  Notifications?: NotificationAttributes[];
}

export interface SubscriptionInstance
extends Sequelize.Instance<SubscriptionAttributes>, SubscriptionAttributes {

}

export interface SubscriptionModel
extends Sequelize.Model<SubscriptionInstance, SubscriptionAttributes> {

}

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: Sequelize.DataTypes,
): Sequelize.Model<SubscriptionInstance, SubscriptionAttributes> => {
  const Subscription = sequelize.define<SubscriptionInstance, SubscriptionAttributes>('Subscription', {
    id: { type: dataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    subscriber_id: { type: dataTypes.INTEGER, allowNull: false },
    category_id: { type: dataTypes.STRING, allowNull: false },
    object_id: { type: dataTypes.STRING, allowNull: false },
    is_active: { type: dataTypes.BOOLEAN, defaultValue: true, allowNull: false },
  }, {
    underscored: true,
    paranoid: true,
    indexes: [
      { fields: ['subscriber_id'] },
      { fields: ['category_id', 'object_id', 'is_active'] },
    ],
    classMethods: {
      emitNotifications: async (
        models: Sequelize.Models,
        category_id: string,
        object_id: string,
        notification_data: any,
        webhook_data: WebhookContent,
        wss?: WebSocket.Server,
      ) => {
        const creatorAddress = await models.Address.findOne({
          where: {
            address: notification_data.author_address,
          },
        });
        // get subscribers to send notifications to
        const where: Sequelize.WhereOptions<SubscriptionAttributes> = {
          [Op.and]: [
            { category_id },
            { object_id },
            { is_active: true },
          ],
          [Op.not]: [{ subscriber_id: creatorAddress.user_id }],
        };
        const subscribers = await models.Subscription.findAll({ where });

        // create notifications if data exists
        if (notification_data) {
          await Promise.all(subscribers.map(async (subscription) => {
            const notification = await models.Notification.create({
              subscription_id: subscription.id,
              notification_data: JSON.stringify(notification_data),
            });
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
          wss.emit('server-event', data, subscribers.map((s) => s.subscriber_id));
        }
        // send data to relevant webhooks
        await send(models, {
          notificationCategory: category_id,
          ...webhook_data
        });
      }
    }
  });

  Subscription.associate = (models) => {
    models.Subscription.belongsTo(models.User, { foreignKey: 'subscriber_id', targetKey: 'id' });
    models.Subscription.belongsTo(models.NotificationCategory, { foreignKey: 'category_id', targetKey: 'name' });
    models.Subscription.hasMany(models.Notification);
  };

  return Subscription;
};
