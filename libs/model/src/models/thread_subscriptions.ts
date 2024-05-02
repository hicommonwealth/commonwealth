import { schemas } from '@hicommonwealth/core';
import Sequelize from 'sequelize';
import { z } from 'zod';
import type { ModelInstance, ModelStatic } from './types';

export type ThreadSubscriptionAttributes = z.infer<
  typeof schemas.entities.ThreadSubscription
>;

export type ThreadSubscriptionInstance =
  ModelInstance<ThreadSubscriptionAttributes>;

export type ThreadSubscriptionModelStatic =
  ModelStatic<ThreadSubscriptionInstance>;

export default (sequelize: Sequelize.Sequelize) =>
  <ThreadSubscriptionModelStatic>sequelize.define<ThreadSubscriptionInstance>(
    'ThreadSubscriptions',
    {
      user_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
      },
      thread_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
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
      tableName: 'ThreadSubscriptions',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: false,
    },
  );
