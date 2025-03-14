import { CommunityAlert } from '@hicommonwealth/schemas';
import Sequelize from 'sequelize';
import { z } from 'zod';
import type { ModelInstance } from './types';

export type CommunityAlertAttributes = z.infer<typeof CommunityAlert>;

export type CommunityAlertInstance = ModelInstance<CommunityAlertAttributes>;

export default (
  sequelize: Sequelize.Sequelize,
): Sequelize.ModelStatic<CommunityAlertInstance> =>
  sequelize.define<CommunityAlertInstance>(
    'CommunityAlerts',
    {
      user_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
      },
      community_id: {
        type: Sequelize.STRING,
        primaryKey: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: new Date(),
        get() {
          return (this.getDataValue(
            'created_at',
          ) as unknown as Date)!.toISOString();
        },
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: new Date(),
        get() {
          return (this.getDataValue(
            'updated_at',
          ) as unknown as Date)!.toISOString();
        },
      },
    },
    {
      tableName: 'CommunityAlerts',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: false,
      indexes: [
        {
          fields: ['community_id'],
        },
      ],
    },
  );
