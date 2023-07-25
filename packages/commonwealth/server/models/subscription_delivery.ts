import type { DataTypes } from 'sequelize';
import Sequelize from 'sequelize';
import type { DB } from '../models';
import type { ModelInstance, ModelStatic } from './types';

export type SubscriptionDeliveryAttributes = {
  id?: number;
  subscription_id: number;
  delivery_mechanism_id: number;
  created_at?: Date;
  updated_at?: Date;
};

export type SubscriptionDeliveryInstance =
  ModelInstance<SubscriptionDeliveryAttributes>;

export type SubscriptionDeliveryModelStatic =
  ModelStatic<SubscriptionDeliveryInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes
): SubscriptionDeliveryModelStatic => {
  const SubscriptionDelivery = <SubscriptionDeliveryModelStatic>(
    sequelize.define(
      'SubscriptionDelivery',
      {
        id: { type: dataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        subscription_id: { type: dataTypes.INTEGER, allowNull: false },
        delivery_mechanism_id: { type: dataTypes.INTEGER, allowNull: false },
      },
      {
        tableName: 'SubscriptionDeliveries',
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      }
    )
  );

  SubscriptionDelivery.associate = (models) => {
    models.SubscriptionDelivery.belongsTo(models.Subscription, {
      foreignKey: 'subscription_id',
      targetKey: 'id',
    });
    models.SubscriptionDelivery.belongsTo(models.DeliveryMechanism, {
      foreignKey: 'delivery_mechanism_id',
      targetKey: 'id',
    });
  };

  return SubscriptionDelivery;
};
