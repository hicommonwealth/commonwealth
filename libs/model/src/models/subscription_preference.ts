import { SubscriptionPreference } from '@hicommonwealth/schemas';
import Sequelize from 'sequelize';
import { z } from 'zod';
import type { ModelInstance, ModelStatic } from './types';

export type SubscriptionPreferenceAttributes = z.infer<
  typeof SubscriptionPreference
>;

export type SubscriptionPreferenceInstance =
  ModelInstance<SubscriptionPreferenceAttributes> & {
    // add mixins as needed
  };

export type SubscriptionPreferenceModelStatic =
  ModelStatic<SubscriptionPreferenceInstance>;

export default (sequelize: Sequelize.Sequelize) =>
  <SubscriptionPreferenceModelStatic>(
    sequelize.define<SubscriptionPreferenceInstance>(
      'SubscriptionPreferences',
      {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        user_id: { type: Sequelize.INTEGER, allowNull: false },
        email_notifications_enabled: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
        },
        digest_email_enabled: { type: Sequelize.BOOLEAN, allowNull: false },
        recap_email_enabled: { type: Sequelize.BOOLEAN, allowNull: false },
        mobile_push_notifications_enabled: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
        },
        mobile_push_discussion_activity_enabled: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
        },
        mobile_push_admin_alerts_enabled: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
        },
        updated_at: {
          type: Sequelize.DATE,
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
