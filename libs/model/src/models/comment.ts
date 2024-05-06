import { EventNames, stats } from '@hicommonwealth/core';
import { logger } from '@hicommonwealth/logging';
import Sequelize from 'sequelize';
import { fileURLToPath } from 'url';
import { IDiscordMeta } from '../types';
import { emitEvent } from '../utils';
import type { AddressAttributes } from './address';
import type { CommunityAttributes } from './community';
import type { ReactionAttributes } from './reaction';
import type { ThreadAttributes } from './thread';
import type { ModelInstance, ModelStatic } from './types';

const __filename = fileURLToPath(import.meta.url);
const log = logger(__filename);

export type CommentAttributes = {
  thread_id: number;
  address_id: number;
  text: string;
  plaintext: string;
  id?: number;
  community_id: string;
  parent_id?: string;
  version_history?: string[];

  canvas_action: string;
  canvas_session: string;
  canvas_hash: string;

  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date;
  marked_as_spam_at?: Date;
  discord_meta?: IDiscordMeta;

  // associations
  Community?: CommunityAttributes;
  Address?: AddressAttributes;
  Thread?: ThreadAttributes;
  reactions?: ReactionAttributes[];

  //counts
  reaction_count: number;
  reaction_weights_sum: number;
};

export type CommentInstance = ModelInstance<CommentAttributes>;

export type CommentModelStatic = ModelStatic<CommentInstance>;

export default (sequelize: Sequelize.Sequelize): CommentModelStatic => {
  const Comment = <CommentModelStatic>sequelize.define(
    'Comment',
    {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      community_id: { type: Sequelize.STRING, allowNull: false },
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
      plaintext: { type: Sequelize.TEXT, allowNull: true },
      version_history: {
        type: Sequelize.ARRAY(Sequelize.TEXT),
        defaultValue: [],
        allowNull: false,
      },
      // signed data
      canvas_action: { type: Sequelize.JSONB, allowNull: true },
      canvas_session: { type: Sequelize.JSONB, allowNull: true },
      canvas_hash: { type: Sequelize.STRING, allowNull: true },
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
    },
    {
      hooks: {
        afterCreate: async (comment: CommentInstance, options) => {
          const { Thread, Outbox } = sequelize.models;
          const thread_id = comment.thread_id;
          try {
            const thread = await Thread.findOne({
              where: { id: thread_id },
            });
            if (thread) {
              await thread.increment('comment_count', {
                transaction: options.transaction,
              });
              stats().increment('cw.hook.comment-count', {
                thread_id: String(thread_id),
              });
            }
          } catch (error) {
            log.error(
              `incrementing comment count error for thread ${thread_id} afterCreate: ${error}`,
            );
          }

          await emitEvent(
            Outbox,
            [
              {
                event_name: EventNames.CommentCreated,
                event_payload: comment.get({ plain: true }),
              },
            ],
            options.transaction,
          );
        },
        afterDestroy: async (comment: CommentInstance, options) => {
          const { Thread } = sequelize.models;
          const thread_id = comment.thread_id;
          try {
            const thread = await Thread.findOne({
              where: { id: thread_id },
            });
            if (thread) {
              await thread.decrement('comment_count', {
                transaction: options.transaction,
              });
              stats().decrement('cw.hook.comment-count', {
                thread_id: String(thread_id),
              });
            }
          } catch (error) {
            log.error(
              `incrementing comment count error for thread ${thread_id} afterDestroy: ${error}`,
            );
            stats().increment('cw.hook.comment-count-error', {
              thread_id: String(thread_id),
            });
          }
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
        { fields: ['community_id', 'created_at'] },
        { fields: ['community_id', 'updated_at'] },
        { fields: ['thread_id'] },
      ],
    },
  );

  Comment.associate = (models) => {
    models.Comment.belongsTo(models.Community, {
      foreignKey: 'community_id',
      targetKey: 'id',
    });
    models.Comment.belongsTo(models.Address, {
      foreignKey: 'address_id',
      targetKey: 'id',
    });
    models.Comment.belongsTo(models.Thread, {
      foreignKey: 'thread_id',
      constraints: false,
      targetKey: 'id',
    });
  };

  return Comment;
};
