import { EventNames, logger, stats } from '@hicommonwealth/core';
import { Reaction } from '@hicommonwealth/schemas';
import Sequelize from 'sequelize';
import { z } from 'zod';
import { emitEvent, getThreadContestManagers } from '../utils';
import type { AddressAttributes } from './address';
import type { ModelInstance } from './types';

const log = logger(import.meta);

export type ReactionAttributes = z.infer<typeof Reaction> & {
  Address?: AddressAttributes;
};

export type ReactionInstance = ModelInstance<ReactionAttributes>;

export default (
  sequelize: Sequelize.Sequelize,
): Sequelize.ModelStatic<ReactionInstance> =>
  sequelize.define<ReactionInstance>(
    'Reaction',
    {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      thread_id: { type: Sequelize.INTEGER, allowNull: true },
      proposal_id: { type: Sequelize.STRING, allowNull: true },
      comment_id: { type: Sequelize.INTEGER, allowNull: true },
      address_id: { type: Sequelize.INTEGER, allowNull: false },
      reaction: { type: Sequelize.ENUM('like'), allowNull: false },
      calculated_voting_weight: { type: Sequelize.INTEGER, allowNull: true },
      // canvas-related columns
      canvas_signed_data: { type: Sequelize.JSONB, allowNull: true },
      canvas_hash: { type: Sequelize.STRING, allowNull: true },
    },
    {
      hooks: {
        afterCreate: async (reaction: ReactionInstance, options) => {
          const { Thread, Comment, Outbox } = sequelize.models;
          const { thread_id, comment_id } = reaction;

          if (thread_id) {
            const thread = await Thread.findOne({ where: { id: thread_id } });
            if (thread) {
              await thread.increment('reaction_count', {
                transaction: options.transaction,
              });
              if (reaction.calculated_voting_weight ?? 0 > 0) {
                await thread.increment('reaction_weights_sum', {
                  by: reaction.calculated_voting_weight!,
                  transaction: options.transaction,
                });
              }
              if (reaction.reaction === 'like') {
                const { topic_id, community_id } = thread.get({ plain: true });
                const contestManagers = !topic_id
                  ? []
                  : await getThreadContestManagers(
                      sequelize,
                      topic_id,
                      community_id,
                    );

                await emitEvent(
                  Outbox,
                  [
                    {
                      event_name: EventNames.ThreadUpvoted,
                      event_payload: {
                        ...reaction.get({ plain: true }),
                        reaction: 'like',
                        community_id,
                        contestManagers,
                      },
                    },
                  ],
                  options.transaction,
                );
              }
              stats().increment('cw.hook.reaction-count', {
                thread_id: String(thread_id),
              });
            }
          } else if (comment_id) {
            const comment = await Comment.findOne({
              where: { id: comment_id },
            });
            if (comment) {
              await comment.increment('reaction_count', {
                transaction: options.transaction,
              });
              if (reaction.calculated_voting_weight ?? 0 > 0) {
                await comment.increment('reaction_weights_sum', {
                  by: reaction.calculated_voting_weight!,
                  transaction: options.transaction,
                });
              }
              stats().increment('cw.hook.reaction-count', {
                thread_id: String(comment.get('thread_id')),
              });
            }
          }
        },

        afterDestroy: async (reaction: ReactionInstance, options) => {
          const { Thread, Comment } = sequelize.models;
          const { thread_id, comment_id } = reaction;

          if (thread_id) {
            const thread = await Thread.findOne({ where: { id: thread_id } });
            if (thread) {
              await thread.decrement('reaction_count', {
                transaction: options.transaction,
              });
              if (reaction.calculated_voting_weight ?? 0 > 0) {
                await thread.decrement('reaction_weights_sum', {
                  by: reaction.calculated_voting_weight!,
                  transaction: options.transaction,
                });
              }
              stats().decrement('cw.hook.reaction-count', {
                thread_id: String(thread_id),
              });
            }
          } else if (comment_id) {
            const comment = await Comment.findOne({
              where: { id: comment_id },
            });
            if (comment) {
              await comment.decrement('reaction_count', {
                transaction: options.transaction,
              });
              if (reaction.calculated_voting_weight ?? 0 > 0) {
                await comment.decrement('reaction_weights_sum', {
                  by: reaction.calculated_voting_weight!,
                  transaction: options.transaction,
                });
              }
              stats().decrement('cw.hook.reaction-count', {
                thread_id: String(comment.get('thread_id')),
              });
            }
          }
        },
      },
      tableName: 'Reactions',
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        { fields: ['thread_id'] },
        { fields: ['address_id'] },
        {
          fields: [
            'address_id',
            'thread_id',
            'proposal_id',
            'comment_id',
            'reaction',
          ],
          name: 'reactions_unique',
          unique: true,
        },
      ],
    },
  );
