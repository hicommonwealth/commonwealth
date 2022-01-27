import * as Sequelize from 'sequelize';
import { Model, DataTypes } from 'sequelize';
import { ModelStatic } from './types';
import { NotificationsReadAttributes, NotificationsReadInstance } from './notifications_read';
import { ChainEventAttributes, ChainEventInstance } from './chain_event';

export interface NotificationAttributes {
  notification_data: string;
  chain_id?: string;
  category_id: string;
  id?: number;
  chain_event_id?: number;
  created_at?: Date;
  updated_at?: Date;
  NotificationsRead?: NotificationsReadAttributes[];
  ChainEvent?: ChainEventAttributes;
}

export interface NotificationInstance
extends Model<NotificationAttributes>, NotificationAttributes {
  getNotificationsRead: Sequelize.HasManyGetAssociationsMixin<NotificationsReadInstance>;
  getChainEvent: Sequelize.HasOneGetAssociationMixin<ChainEventInstance>;
}

export type NotificationModelStatic = ModelStatic<NotificationInstance>

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes,
): NotificationModelStatic => {
  const Notification = <NotificationModelStatic>sequelize.define('Notification', {
    id: { type: dataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    notification_data: { type: dataTypes.TEXT, allowNull: false },
    chain_event_id: { type: dataTypes.INTEGER, allowNull: true },
    chain_id: { type: dataTypes.STRING, allowNull: true }, // for backwards compatibility of threads associated with OffchainCommunities rather than a proper chain
    category_id: { type: dataTypes.STRING, allowNull: false}
  }, {
    tableName: 'Notifications',
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  Notification.associate = (models) => {
    models.Notification.hasMany(models.NotificationsRead, { foreignKey: 'notification_id', onDelete: 'cascade', hooks: true })
    models.Notification.belongsTo(models.ChainEvent, { foreignKey: 'chain_event_id', targetKey: 'id' });
    models.Notification.belongsTo(models.NotificationCategory, { foreignKey: 'category_id', targetKey: 'name'});
    models.Notification.belongsTo(models.Chain, {foreignKey: 'chain_id', targetKey: 'id'});
  };

  return Notification;
};
