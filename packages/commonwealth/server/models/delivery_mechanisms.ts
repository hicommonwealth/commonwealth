import type { DataTypes, Sequelize } from 'sequelize';
import type { ModelInstance, ModelStatic } from './types';
import type { UserAttributes } from './user';

// This Model Purely adds new functionality for these mechanisms, instead of trying to rewrite existing models
// We could refactor, if desired to include / supersede existing models
// (such as email notification interval on user, or webhook url on chain), for now those models are unchanged
export type DeliveryMechanismType =
  | 'browser'
  | 'ios-native'
  | 'desktop'
  | 'android'
  | 'ios-pwa';

export type DeliveryMechanismAttributes = {
  id?: number;
  type: DeliveryMechanismType;
  identifier: string; // e.g., email address, FCM token, url if webhook
  user_id: number;
  enabled: boolean;
  created_at?: Date;
  updated_at?: Date;

  // Associations
  User?: UserAttributes;
};

export type DeliveryMechanismInstance =
  ModelInstance<DeliveryMechanismAttributes>;

export type DeliveryMechanismModelStatic =
  ModelStatic<DeliveryMechanismInstance>;

export default (
  sequelize: Sequelize,
  dataTypes: typeof DataTypes
): DeliveryMechanismModelStatic => {
  const DeliveryMechanism = <DeliveryMechanismModelStatic>sequelize.define(
    'DeliveryMechanism',
    {
      id: { type: dataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      type: { type: dataTypes.STRING, allowNull: false },
      identifier: { type: dataTypes.STRING, allowNull: false },
      user_id: { type: dataTypes.INTEGER, allowNull: false },
      enabled: { type: dataTypes.BOOLEAN, allowNull: false },
    },
    {
      tableName: 'DeliveryMechanisms',
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  DeliveryMechanism.associate = (models) => {
    models.DeliveryMechanism.belongsTo(models.User, {
      foreignKey: 'user_id',
      targetKey: 'id',
    });
    models.DeliveryMechanism.belongsToMany(models.Subscription, {
      through: 'SubscriptionDelivery',
      foreignKey: 'delivery_mechanism_id',
    });
  };

  return DeliveryMechanism;
};
