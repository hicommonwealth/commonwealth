import type * as Sequelize from 'sequelize';
import type { DataTypes } from 'sequelize';

import { StatsDController } from 'common-common/src/statsd';
import type { AddressAttributes } from './address';
import type { CommunityAttributes } from './community';
import type { ModelInstance, ModelStatic } from './types';

import { IDiscordMeta } from '@hicommonwealth/core';
import { factory, formatFilename } from 'common-common/src/logging';
const log = factory.getLogger(formatFilename(__filename));

export type CommentAttributes = {
  thread_id: string;
  address_id: number;
  text: string;
  plaintext: string;
  id?: number;
  chain: string;
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
  Chain?: CommunityAttributes;
  Address?: AddressAttributes;

  //counts
  reaction_count: number;
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
      chain: { type: dataTypes.STRING, allowNull: false },
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
      // signed data
      canvas_action: { type: dataTypes.JSONB, allowNull: true },
      canvas_session: { type: dataTypes.JSONB, allowNull: true },
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
    },
    {
      hooks: {
        afterCreate: async (comment: CommentInstance) => {
          const { Thread } = sequelize.models;
          const thread_id = comment.thread_id;
          try {
            const thread = await Thread.findOne({
              where: { id: thread_id },
            });
            if (thread) {
              thread.increment('comment_count');
              StatsDController.get().increment('cw.hook.comment-count', {
                thread_id,
              });
            }
          } catch (error) {
            log.error(
              `incrementing comment count error for thread ${thread_id} afterCreate: ${error}`,
            );
          }
        },
        afterDestroy: async (comment: CommentInstance) => {
          const { Thread } = sequelize.models;
          const thread_id = comment.thread_id;
          try {
            const thread = await Thread.findOne({
              where: { id: thread_id },
            });
            if (thread) {
              thread.decrement('comment_count');
              StatsDController.get().decrement('cw.hook.comment-count', {
                thread_id,
              });
            }
          } catch (error) {
            log.error(
              `incrementing comment count error for thread ${thread_id} afterDestroy: ${error}`,
            );
            StatsDController.get().increment('cw.hook.comment-count-error', {
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
        { fields: ['chain', 'thread_id'] },
        { fields: ['address_id'] },
        { fields: ['chain', 'created_at'] },
        { fields: ['chain', 'updated_at'] },
        { fields: ['thread_id'] },
        { fields: ['canvas_hash'] },
      ],
    },
  );

  Comment.associate = (models) => {
    models.Comment.belongsTo(models.Community, {
      foreignKey: 'chain',
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
