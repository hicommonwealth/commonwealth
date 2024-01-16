import { logger, stats } from '@hicommonwealth/core';
import type * as Sequelize from 'sequelize';
import type { DataTypes } from 'sequelize';
import type { AddressAttributes } from './address';
import type { CommunityAttributes } from './community';
import type { ModelInstance, ModelStatic } from './types';

const log = logger().getLogger(__filename);

export type ReactionAttributes = {
  address_id: number;
  reaction: string;
  id?: number;
  community_id: string;
  thread_id?: number;
  proposal_id?: number;
  comment_id?: number;

  canvas_action: string;
  canvas_session: string;
  canvas_hash: string;

  created_at?: Date;
  updated_at?: Date;

  Chain?: CommunityAttributes;
  Address?: AddressAttributes;
};

export type ReactionInstance = ModelInstance<ReactionAttributes>;

export type ReactionModelStatic = ModelStatic<ReactionInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes,
): ReactionModelStatic => {
  const Reaction = <ReactionModelStatic>sequelize.define(
    'Reaction',
    {
      id: { type: dataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      community_id: { type: dataTypes.STRING, allowNull: false },
      thread_id: { type: dataTypes.INTEGER, allowNull: true },
      proposal_id: { type: dataTypes.STRING, allowNull: true },
      comment_id: { type: dataTypes.INTEGER, allowNull: true },
      address_id: { type: dataTypes.INTEGER, allowNull: false },
      reaction: { type: dataTypes.STRING, allowNull: false },
      // signed data
      canvas_action: { type: dataTypes.JSONB, allowNull: true },
      canvas_session: { type: dataTypes.JSONB, allowNull: true },
      canvas_hash: { type: dataTypes.STRING, allowNull: true },
    },
    {
      hooks: {
        afterCreate: async (reaction: ReactionInstance) => {
          let thread_id = reaction.thread_id;
          const comment_id = reaction.comment_id;
          const { Thread, Comment } = sequelize.models;
          try {
            if (thread_id) {
              const thread = await Thread.findOne({
                where: { id: thread_id },
              });
              if (thread) {
                thread.increment('reaction_count');
                stats().increment('cw.hook.reaction-count', {
                  thread_id: String(thread_id),
                });
              }
            }

            if (comment_id) {
              const comment = await Comment.findOne({
                where: { id: comment_id },
              });
              if (comment) {
                comment.increment('reaction_count');
                thread_id = Number(comment.get('thread_id'));
                stats().increment('cw.hook.reaction-count', {
                  thread_id: String(thread_id),
                });
              }
            }
          } catch (error) {
            log.error(
              `incrementing thread reaction count ` +
                `afterCreate: thread_id ${thread_id} comment_id ${comment_id} ${error}`,
            );
            stats().increment('cw.reaction-count-error', {
              thread_id: String(thread_id),
            });
          }
        },
        afterDestroy: async (reaction: ReactionInstance) => {
          let thread_id = reaction.thread_id;
          const comment_id = reaction.comment_id;
          const { Thread, Comment } = sequelize.models;
          try {
            if (thread_id) {
              const thread = await Thread.findOne({
                where: { id: thread_id },
              });
              if (thread) {
                thread.decrement('reaction_count');
                stats().decrement('cw.hook.reaction-count', {
                  thread_id: String(thread_id),
                });
              }
            }

            if (comment_id) {
              const comment = await Comment.findOne({
                where: { id: comment_id },
              });
              if (comment) {
                thread_id = Number(comment.get('thread_id'));
                comment.decrement('reaction_count');
                stats().decrement('cw.hook.reaction-count', {
                  thread_id: String(thread_id),
                });
              }
            }
          } catch (error) {
            log.error(
              `incrementing thread reaction count afterDestroy: ` +
                `thread_id ${thread_id} comment_id ${comment_id} ${error}`,
            );
            stats().increment('cw.hook.reaction-count-error', {
              thread_id: String(thread_id),
            });
          }
        },
      },
      tableName: 'Reactions',
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        { fields: ['address_id'] },
        {
          fields: [
            'community_id',
            'address_id',
            'thread_id',
            'proposal_id',
            'comment_id',
            'reaction',
          ],
          unique: true,
        },
        { fields: ['community_id', 'thread_id'] },
        { fields: ['community_id', 'comment_id'] },
      ],
    },
  );

  Reaction.associate = (models) => {
    models.Reaction.belongsTo(models.Community, {
      foreignKey: 'community_id',
      targetKey: 'id',
    });
    models.Reaction.belongsTo(models.Address, {
      foreignKey: 'address_id',
      targetKey: 'id',
    });
    models.Reaction.belongsTo(models.Comment, {
      foreignKey: 'comment_id',
      targetKey: 'id',
    });
    models.Reaction.belongsTo(models.Thread, {
      foreignKey: 'thread_id',
      targetKey: 'id',
    });
  };

  return Reaction;
};
