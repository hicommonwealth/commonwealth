import Sequelize from 'sequelize';
import type { NotificationAttributes } from './notification';
import type { SubscriptionAttributes } from './subscription';
import type { ModelInstance, ModelStatic } from './types';

export type NotificationsReadAttributes = {
  subscription_id: number;
  notification_id: number;
  is_read: boolean;
  user_id: number;
  Subscription?: SubscriptionAttributes;
  Notification?: NotificationAttributes;
};

export type NotificationsReadInstance =
  ModelInstance<NotificationsReadAttributes>;

export type NotificationsReadModelStatic =
  ModelStatic<NotificationsReadInstance>;

export default (
  sequelize: Sequelize.Sequelize,
): NotificationsReadModelStatic => {
  const NotificationsRead = <NotificationsReadModelStatic>sequelize.define(
    'NotificationsRead',
    {
      subscription_id: { type: Sequelize.INTEGER, primaryKey: true },
      notification_id: { type: Sequelize.INTEGER, primaryKey: true },
      is_read: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      user_id: { type: Sequelize.INTEGER, allowNull: false },
    },
    {
      tableName: 'NotificationsRead',
      underscored: true,
      timestamps: false,
      indexes: [{ fields: ['subscription_id'] }],
    },
  );

  NotificationsRead.associate = (models) => {
    models.NotificationsRead.belongsTo(models.Subscription, {
      foreignKey: 'subscription_id',
      targetKey: 'id',
    });
    models.NotificationsRead.belongsTo(models.Notification, {
      foreignKey: 'notification_id',
      targetKey: 'id',
    });
  };

  return NotificationsRead;
};
