import Sequelize, { DataTypes} from 'sequelize';
import { factory, formatFilename } from 'common-common/src/logging';
import { UserAttributes } from '../user';
import { NotificationCategoryAttributes } from '../notification_category';
import { ModelStatic } from '../types';
import { ChainAttributes } from '../chain';
import { ThreadAttributes } from '../thread';
import { CommentAttributes } from '../comment';
import { ChainEventTypeAttributes } from '../chain_event_type';
import { ChainEntityAttributes } from '../chain_entity';
import {
  NotificationsReadAttributes,
  NotificationsReadInstance,
} from '../notifications_read';

const log = factory.getLogger(formatFilename(__filename));


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
  offchain_thread_id?: number;
  offchain_comment_id?: number;
  chain_event_type_id?: string;
  chain_entity_id?: number;

  User?: UserAttributes;
  NotificationCategory?: NotificationCategoryAttributes;
  NotificationsRead?: NotificationsReadAttributes[];
  Chain?: ChainAttributes;
  Thread?: ThreadAttributes;
  Comment?: CommentAttributes;
  ChainEventType?: ChainEventTypeAttributes;
  ChainEntity?: ChainEntityAttributes;
}

export interface SubscriptionInstance
extends Sequelize.Model<SubscriptionAttributes>, SubscriptionAttributes {
  getNotificationsRead: Sequelize.HasManyGetAssociationsMixin<NotificationsReadInstance>;
}

export type SubscriptionModelStatic = ModelStatic<SubscriptionInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes,
): SubscriptionModelStatic => {
  const Subscription = <SubscriptionModelStatic>sequelize.define(
    'Subscription', {
      id: { type: dataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      subscriber_id: { type: dataTypes.INTEGER, allowNull: false },
      category_id: { type: dataTypes.STRING, allowNull: false },
      object_id: { type: dataTypes.STRING, allowNull: false },
      is_active: { type: dataTypes.BOOLEAN, defaultValue: true, allowNull: false },
      immediate_email: { type: dataTypes.BOOLEAN, defaultValue: false, allowNull: false },
      // TODO: change allowNull to false once subscription refactor is implemented
      chain_id: { type: dataTypes.STRING, allowNull: true },
      offchain_thread_id: { type: dataTypes.INTEGER, allowNull: true },
      offchain_comment_id: { type: dataTypes.INTEGER, allowNull: true },
      chain_event_type_id: { type: dataTypes.STRING, allowNull: true },
      chain_entity_id: { type: dataTypes.INTEGER, allowNull: true },
    }, {
      tableName: 'Subscriptions',
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        { fields: ['subscriber_id'] },
        { fields: ['category_id', 'object_id', 'is_active'] },
        { fields: ['offchain_thread_id'] },
      ],
    }
  );

  Subscription.associate = (models) => {
    models.Subscription.belongsTo(models.User, { foreignKey: 'subscriber_id', targetKey: 'id' });
    models.Subscription.belongsTo(models.NotificationCategory, { foreignKey: 'category_id', targetKey: 'name' });
    models.Subscription.hasMany(models.NotificationsRead, { foreignKey: 'subscription_id', onDelete: 'cascade' });
    models.Subscription.belongsTo(models.Chain, { foreignKey: 'chain_id', targetKey: 'id' });
    models.Subscription.belongsTo(models.Thread, { foreignKey: 'offchain_thread_id', targetKey: 'id' });
    models.Subscription.belongsTo(models.Comment, { foreignKey: 'offchain_comment_id', targetKey: 'id' });
    models.Subscription.belongsTo(models.ChainEventType, { foreignKey: 'chain_event_type_id', targetKey: 'id' });
    models.Subscription.belongsTo(models.ChainEntity, { foreignKey: 'chain_entity_id', targetKey: 'id' });
  };

  return Subscription;
};
