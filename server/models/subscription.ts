import Sequelize from 'sequelize';
import send, { WebhookContent } from '../webhookNotifier';
import { NotificationCategories, ProposalType } from '../../shared/types';

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
    wss?,
  ) => {
    const creatorAddress = await models.Address.findOne({
      where: {
        address: notification_data.author_address,
      },
    });
    // get subscribers to send notifications to
    const subscribers = await models.Subscription.findAll({
      where: {
        [Op.and]: [
          { category_id },
          { object_id },
          { is_active: true },
        ],
        [Op.not]: [{ subscriber_id: creatorAddress.user_id }],
      },
    });
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
  };

  return Subscription;
};
