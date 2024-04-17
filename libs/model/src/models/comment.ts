import { IDiscordMeta, stats } from '@hicommonwealth/core';
import { logger } from '@hicommonwealth/logging';
import type * as Sequelize from 'sequelize';
import type { DataTypes } from 'sequelize';
import { fileURLToPath } from 'url';
import type { AddressAttributes } from './address';
import type { CommunityAttributes } from './community';
import { ThreadAttributes } from './thread';
import { type ModelInstance, type ModelStatic } from './types';

const __filename = fileURLToPath(import.meta.url);
const log = logger(__filename);

export type CommentAttributes = {
  thread_id: string;
  address_id: number;
  text: string;
  plaintext: string;
  id?: number;
  community_id: string;
  parent_id?: string;
  version_history?: string[];

  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date;
  marked_as_spam_at?: Date;
  discord_meta?: IDiscordMeta;

  // associations
  Chain?: CommunityAttributes;
  Address?: AddressAttributes;
  Thread?: ThreadAttributes;

  //counts
  reaction_count: number;
  reaction_weights_sum: number;

  // canvas-related columns
  canvas_signed_data: string;
  canvas_hash: string;
};

export type CommentInstance = ModelInstance<CommentAttributes>;

export type CommentModelStatic = ModelStatic<CommentInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes,
): CommentModelStatic => {
  const Comment = <CommentModelStatic>sequelize.define(
    'Comment',
    {
      id: { type: dataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      community_id: { type: dataTypes.STRING, allowNull: false },
      thread_id: {
        type: dataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Threads',
          key: 'id',
        },
      },
      parent_id: { type: dataTypes.STRING, allowNull: true },
      address_id: { type: dataTypes.INTEGER, allowNull: true },
      created_by: { type: dataTypes.STRING, allowNull: true },
      text: { type: dataTypes.TEXT, allowNull: false },
      plaintext: { type: dataTypes.TEXT, allowNull: true },
      version_history: {
        type: dataTypes.ARRAY(dataTypes.TEXT),
        defaultValue: [],
        allowNull: false,
      },

      // canvas-related columns
      canvas_signed_data: { type: dataTypes.JSONB, allowNull: true },
      canvas_hash: { type: dataTypes.STRING, allowNull: true },

      // timestamps
      created_at: { type: dataTypes.DATE, allowNull: false },
      updated_at: { type: dataTypes.DATE, allowNull: false },
      deleted_at: { type: dataTypes.DATE, allowNull: true },
      marked_as_spam_at: { type: dataTypes.DATE, allowNull: true },
      discord_meta: { type: dataTypes.JSONB, allowNull: true },

      //counts
      reaction_count: {
        type: dataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      reaction_weights_sum: {
        type: dataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      hooks: {
        afterCreate: async (comment: CommentInstance, options) => {
          const { Thread } = sequelize.models;
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
                thread_id,
              });
            }
          } catch (error) {
            log.error(
              `incrementing comment count error for thread ${thread_id} afterCreate: ${error}`,
            );
          }
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
                thread_id,
              });
            }
          } catch (error) {
            log.error(
              `incrementing comment count error for thread ${thread_id} afterDestroy: ${error}`,
            );
            stats().increment('cw.hook.comment-count-error', {
              thread_id,
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
    models.Comment.hasMany(models.Reaction, {
      foreignKey: 'comment_id',
      as: 'reactions',
    });
  };

  return Comment;
};
