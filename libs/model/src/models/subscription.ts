import {
  EmitNotification,
  NotificationCategories,
} from '@hicommonwealth/shared';
import Sequelize from 'sequelize';
import type { CommentAttributes } from './comment';
import type { CommunityAttributes } from './community';
import type { NotificationCategoryAttributes } from './notification_category';
import type {
  NotificationsReadAttributes,
  NotificationsReadInstance,
} from './notifications_read';
import type { ThreadAttributes } from './thread';
import type { DataTypes, ModelInstance, ModelStatic } from './types';
import type { UserAttributes } from './user';

export enum SubscriptionValidationErrors {
  NoCommunityId = 'Must provide a community_id',
  NoSnapshotId = 'Must provide a snapshot_id',
  NoThreadOrComment = 'Must provide a thread_id or a comment_id',
  NotBothThreadAndComment = 'Cannot provide both thread_id and comment_id',
  UnsupportedCategory = 'Subscriptions for this category are not supported',
}

export type SubscriptionAttributes = {
  subscriber_id: number;
  category_id: string;
  id?: number;
  is_active?: boolean;
  immediate_email?: boolean;
  created_at?: Date;
  updated_at?: Date;
  community_id?: string;
  thread_id?: number;
  comment_id?: number;
  snapshot_id?: string;

  User?: UserAttributes;
  NotificationCategory?: NotificationCategoryAttributes;
  NotificationsRead?: NotificationsReadAttributes[];
  Community?: CommunityAttributes;
  Thread?: ThreadAttributes;
  Comment?: CommentAttributes;
};

export type SubscriptionInstance = ModelInstance<SubscriptionAttributes> & {
  getNotificationsRead: Sequelize.HasManyGetAssociationsMixin<NotificationsReadInstance>;
};

export type SubscriptionModelStatic = ModelStatic<SubscriptionInstance> & {
  emitNotification?: EmitNotification<SubscriptionInstance>;
};

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: DataTypes,
): SubscriptionModelStatic => {
  const Subscription = <SubscriptionModelStatic>sequelize.define(
    'Subscription',
    {
      id: { type: dataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      subscriber_id: { type: dataTypes.INTEGER, allowNull: false },
      category_id: { type: dataTypes.STRING, allowNull: false },
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
      community_id: { type: dataTypes.STRING, allowNull: true },
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
      indexes: [{ fields: ['subscriber_id'] }, { fields: ['thread_id'] }],
      validate: {
        // The validation checks defined here are replicated exactly at the database level using CONSTRAINTS
        // on the Subscriptions table itself. Any update here MUST be made at the database level too.
        validSubscription() {
          if (!this.category_id) return;

          switch (this.category_id) {
            case NotificationCategories.ChainEvent:
            case NotificationCategories.NewThread:
              if (!this.community_id)
                throw new Error(SubscriptionValidationErrors.NoCommunityId);
              break;
            case NotificationCategories.SnapshotProposal:
              if (!this.snapshot_id)
                throw new Error(SubscriptionValidationErrors.NoSnapshotId);
              break;
            case NotificationCategories.NewComment:
            case NotificationCategories.NewReaction:
              if (!this.community_id)
                throw new Error(SubscriptionValidationErrors.NoCommunityId);
              if (!this.thread_id && !this.comment_id)
                throw new Error(SubscriptionValidationErrors.NoThreadOrComment);
              if (this.thread_id && this.comment_id)
                throw new Error(
                  SubscriptionValidationErrors.NotBothThreadAndComment,
                );
              break;
            case NotificationCategories.NewMention:
            case NotificationCategories.NewCollaboration:
              break;
            default:
              throw new Error(SubscriptionValidationErrors.UnsupportedCategory);
          }
        },
      },
    },
  );

  Subscription.associate = (models) => {
    models.Subscription.hasMany(models.NotificationsRead, {
      foreignKey: 'subscription_id',
      onDelete: 'cascade',
    });
    models.Subscription.belongsTo(models.Community, {
      as: 'Community',
      foreignKey: 'community_id',
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
