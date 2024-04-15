import { schemas } from '@hicommonwealth/core';
import type * as Sequelize from 'sequelize';
import type { DataTypes } from 'sequelize';
import { z } from 'zod';
import type { ModelInstance, ModelStatic } from './types';

export type SubscriptionPreferenceAttributes = z.infer<
  typeof schemas.entities.SubscriptionPreference
>;

export type SubscriptionPreferenceInstance =
  ModelInstance<SubscriptionPreferenceAttributes> & {
    // add mixins as needed
  };

export type SubscriptionPreferenceModelStatic =
  ModelStatic<SubscriptionPreferenceInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes,
): SubscriptionPreferenceModelStatic => {
  const SubscriptionPreferences = <SubscriptionPreferenceModelStatic>(
    sequelize.define(
      'SubscriptionPreferences',
      {
        id: { type: dataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        user_id: { type: dataTypes.INTEGER, allowNull: false },
        email_notifications_enabled: {
          type: dataTypes.BOOLEAN,
          allowNull: false,
        },
        digest_email_enabled: { type: dataTypes.BOOLEAN, allowNull: false },
        recap_email_enabled: { type: dataTypes.BOOLEAN, allowNull: false },
        mobile_push_notifications_enabled: {
          type: dataTypes.BOOLEAN,
          allowNull: false,
        },
        mobile_push_discussion_activity_enabled: {
          type: dataTypes.BOOLEAN,
          allowNull: false,
        },
        mobile_push_admin_alerts_enabled: {
          type: dataTypes.BOOLEAN,
          allowNull: false,
        },
        created_at: {
          type: dataTypes.DATE,
          allowNull: false,
          defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
        },
        updated_at: {
          type: dataTypes.DATE,
          allowNull: false,
          defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
        },
      },
      {
        tableName: 'SubscriptionPreferences',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        underscored: false,
        indexes: [
          {
            fields: ['user_id'],
            unique: true,
          },
        ],
      },
    )
  );

  SubscriptionPreferences.associate = (models: any) => {
    SubscriptionPreferences.belongsTo(models.User, {
      foreignKey: 'user_id',
    });
  };

  return SubscriptionPreferences;
};
