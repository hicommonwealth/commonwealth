import * as Sequelize from 'sequelize';
import { BuildOptions, Model, DataTypes } from 'sequelize';

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
extends Model<NotificationAttributes>, NotificationAttributes {}

type NotificationModelStatic = typeof Model
    & { associate: (models: any) => void }
    & { new(values?: Record<string, unknown>, options?: BuildOptions): NotificationInstance }

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes,
): NotificationModelStatic => {
  const Notification = <NotificationModelStatic>sequelize.define('Notification', {
    id: { type: dataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    subscription_id: { type: dataTypes.INTEGER, allowNull: false },
    notification_data: { type: dataTypes.TEXT, allowNull: false },
    is_read: { type: dataTypes.BOOLEAN, defaultValue: false, allowNull: false },
    chain_event_id: { type: dataTypes.INTEGER, allowNull: true },
  }, {
    tableName: 'Notifications',
    underscored: true,
    indexes: [
      { fields: ['subscription_id'] },
    ],
  });

  Notification.associate = (models) => {
    models.Notification.belongsTo(models.Subscription, { foreignKey: 'subscription_id', targetKey: 'id' });
    models.Notification.belongsTo(models.ChainEvent, { foreignKey: 'chain_event_id', targetKey: 'id' });
  };

  return Notification;
};
