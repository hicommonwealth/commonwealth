import { logger, stats } from '@hicommonwealth/core';
import type * as Sequelize from 'sequelize';
import type { DataTypes } from 'sequelize';
import type { AddressAttributes } from './address';
import type { CommunityAttributes } from './community';
import {
  canvasModelSequelizeColumns,
  type CanvasModelAttributes,
  type ModelInstance,
  type ModelStatic,
} from './types';

const log = logger().getLogger(__filename);

export type ReactionAttributes = {
  address_id: number;
  reaction: string;
  id?: number;
  community_id: string;
  thread_id?: number;
  proposal_id?: number;
  comment_id?: number;

  calculated_voting_weight: number;

  created_at?: Date;
  updated_at?: Date;

  Chain?: CommunityAttributes;
  Address?: AddressAttributes;
} & CanvasModelAttributes;

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
      calculated_voting_weight: { type: dataTypes.INTEGER, allowNull: true },
      // signed data
      ...canvasModelSequelizeColumns(dataTypes),
    },
    {
      hooks: {
        afterCreate: async (reaction: ReactionInstance, options) => {
          let thread_id = reaction.thread_id;
          const comment_id = reaction.comment_id;
          const { Thread, Comment } = sequelize.models;
          try {
            if (thread_id) {
              const thread = await Thread.findOne({
                where: { id: thread_id },
              });
              if (thread) {
                await thread.increment('reaction_count', {
                  transaction: options.transaction,
                });
                if (reaction.calculated_voting_weight > 0) {
                  await thread.increment('reaction_weights_sum', {
                    by: reaction.calculated_voting_weight,
                    transaction: options.transaction,
                  });
                }
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
                await comment.increment('reaction_count', {
                  transaction: options.transaction,
                });
                if (reaction.calculated_voting_weight > 0) {
                  await comment.increment('reaction_weights_sum', {
                    by: reaction.calculated_voting_weight,
                    transaction: options.transaction,
                  });
                }
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
        afterDestroy: async (reaction: ReactionInstance, options) => {
          let thread_id = reaction.thread_id;
          const comment_id = reaction.comment_id;
          const { Thread, Comment } = sequelize.models;
          try {
            if (thread_id) {
              const thread = await Thread.findOne({
                where: { id: thread_id },
              });
              if (thread) {
                await thread.decrement('reaction_count', {
                  transaction: options.transaction,
                });
                if (reaction.calculated_voting_weight > 0) {
                  await thread.decrement('reaction_weights_sum', {
                    by: reaction.calculated_voting_weight,
                    transaction: options.transaction,
                  });
                }
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
                await comment.decrement('reaction_count', {
                  transaction: options.transaction,
                });
                if (reaction.calculated_voting_weight > 0) {
                  await comment.decrement('reaction_weights_sum', {
                    by: reaction.calculated_voting_weight,
                    transaction: options.transaction,
                  });
                }
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
