import { SubscriptionPreference } from '@hicommonwealth/schemas';
import Sequelize from 'sequelize';
import { z } from 'zod';
import type { ModelInstance } from './types';

export type SubscriptionPreferenceAttributes = z.infer<
  typeof SubscriptionPreference
>;

export type SubscriptionPreferenceInstance =
  ModelInstance<SubscriptionPreferenceAttributes> & {
    // add mixins as needed
  };

export default (
  sequelize: Sequelize.Sequelize,
): Sequelize.ModelStatic<SubscriptionPreferenceInstance> =>
  sequelize.define<SubscriptionPreferenceInstance>(
    'SubscriptionPreferences',
    {
      user_id: { type: Sequelize.INTEGER, primaryKey: true },
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
        defaultValue: new Date(),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: new Date(),
      },
    },
    {
      tableName: 'SubscriptionPreferences',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: false,
    },
  );
