import * as Sequelize from 'sequelize';

import { SubscriptionAttributes } from './subscription';

export interface NotificationAttributes {
  id?: number;
  subscription_id: number;
  notification_data: string;
  is_read?: boolean;
  chain_event_id?: number;
  created_at?: Date;
  updated_at?: Date;
  Subscription?: SubscriptionAttributes;
}

export interface NotificationInstance
extends Sequelize.Instance<NotificationAttributes>, NotificationAttributes {

}

export interface NotificationModel extends Sequelize.Model<NotificationInstance, NotificationAttributes> {

}

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: Sequelize.DataTypes,
): NotificationModel => {
  const Notification = sequelize.define<NotificationInstance, NotificationAttributes>('Notification', {
    id: { type: dataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    subscription_id: { type: dataTypes.INTEGER, allowNull: false },
    notification_data: { type: dataTypes.TEXT, allowNull: false },
    is_read: { type: dataTypes.BOOLEAN, defaultValue: false, allowNull: false },
    chain_event_id: { type: dataTypes.INTEGER, allowNull: true },
  }, {
    underscored: true,
    indexes: [
      { fields: ['subscription_id'] },
    ]
  });

  Notification.associate = (models) => {
    models.Notification.belongsTo(models.Subscription, { foreignKey: 'subscription_id', targetKey: 'id' });
    models.Notification.belongsTo(models.ChainEvent, { foreignKey: 'chain_event_id', targetKey: 'id' });
  };

  return Notification;
};
