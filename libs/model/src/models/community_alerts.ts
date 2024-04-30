import { schemas } from '@hicommonwealth/core';
import type * as Sequelize from 'sequelize';
import { z } from 'zod';
import type { ModelInstance, ModelStatic } from './types';

export type CommunityAlertAttributes = z.infer<
  typeof schemas.entities.CommunityAlert
>;

export type CommunityAlertInstance = ModelInstance<CommunityAlertAttributes>;

export type CommunityAlertModelStatic = ModelStatic<CommunityAlertInstance>;

export default (sequelize: Sequelize.Sequelize) =>
  <CommunityAlertModelStatic>sequelize.define<CommunityAlertInstance>(
    'CommunityAlerts',
    {
      id: {
        type: dataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: dataTypes.INTEGER,
        allowNull: false,
      },
      community_id: {
        type: dataTypes.STRING,
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
      tableName: 'CommunityAlerts',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: false,
      indexes: [
        {
          fields: ['user_id', 'community_id'],
          unique: true,
        },
      ],
    },
  );
