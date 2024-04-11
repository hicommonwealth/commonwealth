import { stats } from '@hicommonwealth/core';
import { logger } from '@hicommonwealth/logging';
import { fileURLToPath } from 'node:url';
import type * as Sequelize from 'sequelize';
import type { DataTypes } from 'sequelize';
import type {
  NotificationsReadAttributes,
  NotificationsReadInstance,
} from './notifications_read';
import type { ModelInstance, ModelStatic } from './types';

const __filename = fileURLToPath(import.meta.url);
const log = logger(__filename);

export type NotificationAttributes = {
  id: number;
  notification_data: string;
  community_id?: string;
  category_id: string;
  chain_event_id?: number;
  entity_id: number;
  created_at?: Date;
  updated_at?: Date;
  thread_id?: number;
  NotificationsRead?: NotificationsReadAttributes[];
};

export type NotificationInstance = ModelInstance<NotificationAttributes> & {
  getNotificationsRead: Sequelize.HasManyGetAssociationsMixin<NotificationsReadInstance>;
};

export type NotificationModelStatic = ModelStatic<NotificationInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes,
): NotificationModelStatic => {
  const Notification = <NotificationModelStatic>sequelize.define(
    'Notification',
    {
      id: { type: dataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      notification_data: { type: dataTypes.TEXT, allowNull: true },
      chain_event_id: {
        type: dataTypes.INTEGER,
        allowNull: true,
        unique: true,
      },
      entity_id: { type: dataTypes.INTEGER, allowNull: true },
      community_id: { type: dataTypes.STRING, allowNull: true },
      category_id: { type: dataTypes.STRING, allowNull: false },
      thread_id: { type: dataTypes.INTEGER, allowNull: true },
    },
    {
      hooks: {
        afterCreate: async (notification) => {
          let id, category_id, thread_id;
          const { Thread } = sequelize.models;
          try {
            ({ id, category_id, thread_id } = notification);
            if (
              ['new-thread-creation', 'new-comment-creation'].includes(
                category_id,
              ) &&
              thread_id
            ) {
              await Thread.update(
                { max_notif_id: id },
                { where: { id: thread_id } },
              );
              stats().increment('cw.hook.thread-notif-update', {
                thread_id: String(thread_id),
              });
            }
          } catch (error) {
            log.error(
              `incrementing thread notif for thread ${thread_id} afterCreate: ${error}`,
            );
            stats().increment('cw.hook.thread-notif-error', {
              thread_id: String(thread_id),
            });
          }
        },
      },
      tableName: 'Notifications',
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [{ fields: ['thread_id'] }],
    },
  );

  Notification.associate = (models) => {
    models.Notification.hasMany(models.NotificationsRead, {
      foreignKey: 'notification_id',
      onDelete: 'cascade',
      hooks: true,
    });
    models.Notification.belongsTo(models.NotificationCategory, {
      foreignKey: 'category_id',
      targetKey: 'name',
    });
    models.Notification.belongsTo(models.Community, {
      foreignKey: 'community_id',
      targetKey: 'id',
    });
    models.Notification.belongsTo(models.Thread, {
      foreignKey: 'thread_id',
      targetKey: 'id',
    });
  };

  return Notification;
};
