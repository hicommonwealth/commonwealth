import type { DataTypes } from 'sequelize';
import Sequelize from 'sequelize';
import type {
  IChainEventNotificationData,
  ICommunityNotificationData,
  IPostNotificationData,
  ISnapshotNotificationData,
} from '../../shared/types';
import type { DB } from '../models';
import type { WebhookContent } from '../webhookNotifier';
import type { ChainAttributes } from './chain';
import type { CommentAttributes } from './comment';
import type { NotificationInstance } from './notification';
import type { NotificationCategoryAttributes } from './notification_category';
import type { ThreadAttributes } from './thread';
import type { ModelInstance, ModelStatic } from './types';
import type { UserAttributes } from './user';

export type SubscriptionAttributes = {
  subscriber_id: number;
  category_id: string;
  object_id: string;
  id?: number;
  is_active?: boolean;
  immediate_email?: boolean;
  created_at?: Date;
  updated_at?: Date;
  chain_id?: string;
  thread_id?: number;
  comment_id?: number;
  snapshot_id?: string;

  User?: UserAttributes;
  NotificationCategory?: NotificationCategoryAttributes;
  Chain?: ChainAttributes;
  Thread?: ThreadAttributes;
  Comment?: CommentAttributes;
};

export type SubscriptionInstance = ModelInstance<SubscriptionAttributes> & {};

export type SubscriptionModelStatic = ModelStatic<SubscriptionInstance> & {
  emitNotifications?: (
    models: DB,
    category_id: string,
    object_id: string,
    notification_data:
      | IPostNotificationData
      | ICommunityNotificationData
      | IChainEventNotificationData
      | ISnapshotNotificationData,
    webhook_data?: Partial<WebhookContent>,
    excludeAddresses?: string[],
    includeAddresses?: string[]
  ) => Promise<NotificationInstance>;
};

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes
): SubscriptionModelStatic => {
  const Subscription = <SubscriptionModelStatic>sequelize.define(
    'Subscription',
    {
      id: { type: dataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      subscriber_id: { type: dataTypes.INTEGER, allowNull: false },
      category_id: { type: dataTypes.STRING, allowNull: false },
      object_id: { type: dataTypes.STRING, allowNull: false },
      is_active: {
        type: dataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
      immediate_email: {
        type: dataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      // TODO: change allowNull to false once subscription refactor is implemented
      chain_id: { type: dataTypes.STRING, allowNull: true },
      thread_id: { type: dataTypes.INTEGER, allowNull: true },
      comment_id: { type: dataTypes.INTEGER, allowNull: true },
      snapshot_id: {
        type: Sequelize.STRING,
        allowNull: true,
      },
    },
    {
      tableName: 'Subscriptions',
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        { fields: ['subscriber_id'], name: 'subscriptions_subscriber_id' },
        {
          fields: ['category_id', 'object_id'],
          name: 'subscriptions_chain_category',
        },
        { fields: ['offchain_thread_id'] },
      ],
    }
  );

  Subscription.associate = (models) => {
    models.Subscription.belongsTo(models.User, {
      foreignKey: 'subscriber_id',
      targetKey: 'id',
    });
    models.Subscription.belongsTo(models.NotificationCategory, {
      foreignKey: 'category_id',
      targetKey: 'name',
    });
    models.Subscription.belongsTo(models.Chain, {
      foreignKey: 'chain_id',
      targetKey: 'id',
    });
    models.Subscription.belongsTo(models.Thread, {
      foreignKey: 'thread_id',
      targetKey: 'id',
    });
    models.Subscription.belongsTo(models.Comment, {
      foreignKey: 'comment_id',
      targetKey: 'id',
    });
  };

  return Subscription;
};
