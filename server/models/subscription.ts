import Sequelize from 'sequelize';
import send, { WebhookContent } from '../webhookNotifier';

const { Op } = Sequelize;

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
    category_id,
    object_id,
    notification_data,
    webhook_data: WebhookContent,
    wss?,
  ) => {
    const creatorAddress = notification_data.author_address
      ? await models.Address.findOne({
        where: {
          address: notification_data.author_address,
        },
      })
      : null;
    // get subscribers to send notifications to
    const findOptions: any = {
      [Op.and]: [
        { category_id },
        { object_id },
        { is_active: true },
      ],
    };
    if (creatorAddress) {
      findOptions[Op.not] = [{ subscriber_id: creatorAddress.user_id }];
    }
    const subscribers = await models.Subscription.findAll({ where: findOptions });

    // create notifications if data exists
    let notifications = [];
    if (notification_data) {
      notifications = await Promise.all(subscribers.map(async (subscription) => {
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
    return notifications;
  };

  return Subscription;
};
