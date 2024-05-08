import { CommentSubscription } from '@hicommonwealth/schemas';
import Sequelize from 'sequelize'; // must use "* as" to avoid scope errors
import { z } from 'zod';
import type { ModelInstance, ModelStatic } from './types';

export type CommentSubscriptionAttributes = z.infer<typeof CommentSubscription>;

export type CommentSubscriptionInstance =
  ModelInstance<CommentSubscriptionAttributes>;
export type CommentSubscriptionModelStatic =
  ModelStatic<CommentSubscriptionInstance>;

export default (sequelize: Sequelize.Sequelize) =>
  <CommentSubscriptionModelStatic>sequelize.define<CommentSubscriptionInstance>(
    'CommentSubscriptions',
    {
      user_id: { type: Sequelize.INTEGER, primaryKey: true },
      comment_id: { type: Sequelize.INTEGER, primaryKey: true },
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
      tableName: 'CommentSubscriptions',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: false,
      indexes: [
        { fields: ['user_id', 'comment_id'], unique: true },
        { fields: ['comment_id'] },
      ],
    },
  );
