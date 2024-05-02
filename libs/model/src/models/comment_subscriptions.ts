import { entities } from '@hicommonwealth/schemas';
import Sequelize from 'sequelize'; // must use "* as" to avoid scope errors
import { z } from 'zod';
import type { ModelInstance, ModelStatic } from './types';

export type CommentSubscriptionAttributes = z.infer<
  typeof entities.CommentSubscription
>;

export type CommentSubscriptionInstance =
  ModelInstance<CommentSubscriptionAttributes>;
export type CommentSubscriptionModelStatic =
  ModelStatic<CommentSubscriptionInstance>;

export default (sequelize: Sequelize.Sequelize) =>
  <CommentSubscriptionModelStatic>sequelize.define<CommentSubscriptionInstance>(
    'CommentSubscriptions',
    {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      user_id: { type: Sequelize.INTEGER, allowNull: false },
      comment_id: { type: Sequelize.INTEGER, allowNull: false },
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
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      tableName: 'CommentSubscriptions',
      underscored: false,
      indexes: [{ fields: ['user_id', 'comment_id'], unique: true }],
    },
  );
