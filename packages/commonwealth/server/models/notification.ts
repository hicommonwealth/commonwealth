import type * as Sequelize from 'sequelize';
import type { DataTypes } from 'sequelize';
import type { ModelInstance, ModelStatic } from './types';

export type NotificationAttributes = {
  id: number;
  notification_data: string;
  chain_id?: string;
  category_id: string;
  chain_event_id?: number;
  entity_id: number;
  created_at?: Date;
  updated_at?: Date;
  thread_id?: number;
};

export type NotificationInstance = ModelInstance<NotificationAttributes> & {};

export type NotificationModelStatic = ModelStatic<NotificationInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes
): NotificationModelStatic => {
  const Notification = <NotificationModelStatic>sequelize.define(
    'Notification',
    {
      id: { type: dataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      notification_data: { type: dataTypes.TEXT, allowNull: false },
      chain_event_id: { type: dataTypes.INTEGER, allowNull: true },
      entity_id: { type: dataTypes.INTEGER, allowNull: true },
      chain_id: { type: dataTypes.STRING, allowNull: true }, // for backwards compatibility of threads associated with OffchainCommunities rather than a proper chain
      category_id: { type: dataTypes.STRING, allowNull: false },
      thread_id: { type: dataTypes.INTEGER, allowNull: true },
    },
    {
      tableName: 'Notifications',
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [{ fields: ['chain_event_id'], prefix: 'new' }],
    }
  );

  Notification.associate = (models) => {
    models.Notification.belongsTo(models.NotificationCategory, {
      foreignKey: 'category_id',
      targetKey: 'name',
    });
    models.Notification.belongsTo(models.Chain, {
      foreignKey: 'chain_id',
      targetKey: 'id',
    });
    models.Notification.belongsTo(models.Thread, {
      foreignKey: 'thread_id',
      targetKey: 'id',
    });
  };

  return Notification;
};
