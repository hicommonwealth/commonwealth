import { logger, stats } from '@hicommonwealth/core';
import Sequelize from 'sequelize';
import type {
  NotificationsReadAttributes,
  NotificationsReadInstance,
} from './notifications_read';
import type { ModelInstance } from './types';

const log = logger(import.meta);

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

export default (
  sequelize: Sequelize.Sequelize,
): Sequelize.ModelStatic<NotificationInstance> =>
  sequelize.define<NotificationInstance>(
    'Notification',
    {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      notification_data: { type: Sequelize.TEXT, allowNull: true },
      chain_event_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        unique: true,
      },
      entity_id: { type: Sequelize.INTEGER, allowNull: true },
      community_id: { type: Sequelize.STRING, allowNull: true },
      category_id: { type: Sequelize.STRING, allowNull: false },
      thread_id: { type: Sequelize.INTEGER, allowNull: true },
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
