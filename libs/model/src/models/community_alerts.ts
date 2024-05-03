import { schemas } from '@hicommonwealth/core';
import Sequelize from 'sequelize';
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
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      community_id: {
        type: Sequelize.STRING,
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
