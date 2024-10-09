import { stats } from '@hicommonwealth/core';
import { Comment } from '@hicommonwealth/schemas';
import { getDecodedString } from '@hicommonwealth/shared';
import Sequelize from 'sequelize';
import { z } from 'zod';
import type {
  CommentSubscriptionAttributes,
  ModelInstance,
  ReactionAttributes,
  ThreadInstance,
} from '.';

export type CommentAttributes = z.infer<typeof Comment> & {
  // associations
  reactions?: ReactionAttributes[];
  subscriptions?: CommentSubscriptionAttributes[];
};

export type CommentInstance = ModelInstance<CommentAttributes>;

export default (
  sequelize: Sequelize.Sequelize,
): Sequelize.ModelStatic<CommentInstance> =>
  sequelize.define<CommentInstance>(
    'Comment',
    {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      thread_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Threads',
          key: 'id',
        },
      },
      parent_id: { type: Sequelize.STRING, allowNull: true },
      address_id: { type: Sequelize.INTEGER, allowNull: true },
      created_by: { type: Sequelize.STRING, allowNull: true },
      text: { type: Sequelize.TEXT, allowNull: false },

      // canvas-related columns
      canvas_signed_data: { type: Sequelize.JSONB, allowNull: true },
      canvas_msg_id: { type: Sequelize.STRING, allowNull: true },

      // timestamps
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
      marked_as_spam_at: { type: Sequelize.DATE, allowNull: true },
      discord_meta: { type: Sequelize.JSONB, allowNull: true },

      //counts
      reaction_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      reaction_weights_sum: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      search: {
        type: Sequelize.TSVECTOR,
        allowNull: false,
      },
      content_url: { type: Sequelize.STRING, allowNull: true },
    },
    {
      hooks: {
        afterCreate: async (comment, options) => {
          await (
            sequelize.models.Thread as Sequelize.ModelStatic<ThreadInstance>
          ).update(
            {
              comment_count: Sequelize.literal('comment_count + 1'),
              activity_rank_date: comment.created_at,
            },
            {
              where: { id: comment.thread_id },
              transaction: options.transaction,
            },
          );
          stats().increment('cw.hook.comment-count', {
            thread_id: String(comment.thread_id),
          });
        },

        afterDestroy: async ({ thread_id }, options) => {
          await (
            sequelize.models.Thread as Sequelize.ModelStatic<ThreadInstance>
          ).update(
            {
              comment_count: Sequelize.literal('comment_count - 1'),
            },
            {
              where: { id: thread_id },
              transaction: options.transaction,
            },
          );
          stats().decrement('cw.hook.comment-count', {
            thread_id: String(thread_id),
          });
        },
      },
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
      tableName: 'Comments',
      underscored: true,
      paranoid: true,
      indexes: [
        { fields: ['id'] },
        { fields: ['address_id'] },
        { fields: ['created_at'] },
        { fields: ['updated_at'] },
        { fields: ['thread_id'] },
      ],
    },
  );

export function getCommentSearchVector(body: string) {
  return Sequelize.fn('to_tsvector', 'english', getDecodedString(body));
}
