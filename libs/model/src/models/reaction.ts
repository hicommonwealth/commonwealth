import { EventNames, stats } from '@hicommonwealth/core';
import { Reaction } from '@hicommonwealth/schemas';
import Sequelize from 'sequelize';
import { z } from 'zod';
import type {
  AddressAttributes,
  CommentInstance,
  ModelInstance,
  ThreadInstance,
} from '.';
import { emitEvent, getThreadContestManagers } from '../utils';

export type ReactionAttributes = z.infer<typeof Reaction>;
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
      canvas_msg_id: { type: Sequelize.STRING, allowNull: true },
    },
    {
      hooks: {
        afterCreate: async (reaction, options) => {
          const { Outbox, Address } = sequelize.models;
          const { thread_id, comment_id } = reaction;
          if (thread_id) {
            const [, threads] = await (
              sequelize.models.Thread as Sequelize.ModelStatic<ThreadInstance>
            ).update(
              {
                reaction_count: Sequelize.literal('reaction_count + 1'),
                reaction_weights_sum: Sequelize.literal(
                  `reaction_weights_sum + ${
                    reaction.calculated_voting_weight ?? 0
                  }`,
                ),
              },
              {
                where: { id: thread_id },
                returning: true,
                transaction: options.transaction,
              },
            );
            const thread = threads.at(0)!;
            if (reaction.reaction === 'like') {
              const contestManagers = !thread.topic_id
                ? []
                : await getThreadContestManagers(
                    sequelize,
                    thread.topic_id,
                    thread.community_id,
                  );

              const address = (await Address.findByPk(
                reaction.address_id,
              )) as AddressAttributes | null;

              await emitEvent(
                Outbox,
                [
                  {
                    event_name: EventNames.ThreadUpvoted,
                    event_payload: {
                      ...reaction.toJSON(),
                      address: address?.address,
                      community_id: thread.community_id,
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
          } else if (comment_id) {
            const [, comments] = await (
              sequelize.models.Comment as Sequelize.ModelStatic<CommentInstance>
            ).update(
              {
                reaction_count: Sequelize.literal('reaction_count + 1'),
                reaction_weights_sum: Sequelize.literal(
                  `reaction_weights_sum + ${
                    reaction.calculated_voting_weight ?? 0
                  }`,
                ),
              },
              {
                where: { id: comment_id },
                returning: true,
                transaction: options.transaction,
              },
            );
            if (reaction.reaction === 'like') {
              await emitEvent(
                sequelize.models.Outbox,
                [
                  {
                    event_name: EventNames.CommentUpvoted,
                    event_payload: {
                      ...reaction.toJSON(),
                    },
                  },
                ],
                options.transaction,
              );
            }
            stats().increment('cw.hook.reaction-count', {
              thread_id: String(comments.at(0)!.thread_id),
            });
          }
        },

        afterDestroy: async (
          { thread_id, comment_id, calculated_voting_weight },
          options,
        ) => {
          if (thread_id) {
            await (
              sequelize.models.Thread as Sequelize.ModelStatic<ThreadInstance>
            ).update(
              {
                reaction_count: Sequelize.literal('reaction_count - 1'),
                reaction_weights_sum: Sequelize.literal(
                  `reaction_weights_sum - ${calculated_voting_weight ?? 0}`,
                ),
              },
              {
                where: { id: thread_id },
                transaction: options.transaction,
              },
            );
            stats().decrement('cw.hook.reaction-count', {
              thread_id: String(thread_id),
            });
          } else if (comment_id) {
            const [, comments] = await (
              sequelize.models.Comment as Sequelize.ModelStatic<CommentInstance>
            ).update(
              {
                reaction_count: Sequelize.literal('reaction_count - 1'),
                reaction_weights_sum: Sequelize.literal(
                  `reaction_weights_sum - ${calculated_voting_weight ?? 0}`,
                ),
              },
              {
                where: { id: comment_id },
                returning: true,
                transaction: options.transaction,
              },
            );
            stats().decrement('cw.hook.reaction-count', {
              thread_id: String(comments.at(0)!.thread_id),
            });
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
