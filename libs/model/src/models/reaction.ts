import { EventNames, stats } from '@hicommonwealth/core';
import { logger } from '@hicommonwealth/logging';
import Sequelize from 'sequelize';
import { fileURLToPath } from 'url';
import { emitEvent } from '../utils';
import type { AddressAttributes } from './address';
import type { CommunityAttributes } from './community';
import type { ModelInstance, ModelStatic } from './types';

const __filename = fileURLToPath(import.meta.url);
const log = logger(__filename);

export type ReactionAttributes = {
  address_id: number;
  reaction: string;
  id?: number;
  community_id: string;
  thread_id?: number;
  proposal_id?: number;
  comment_id?: number;

  calculated_voting_weight: number;

  canvas_action: string;
  canvas_session: string;
  canvas_hash: string;

  created_at?: Date;
  updated_at?: Date;

  Community?: CommunityAttributes;
  Address?: AddressAttributes;
};

export type ReactionInstance = ModelInstance<ReactionAttributes>;

export type ReactionModelStatic = ModelStatic<ReactionInstance>;

export default (sequelize: Sequelize.Sequelize) =>
  <ReactionModelStatic>sequelize.define<ReactionInstance>(
    'Reaction',
    {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      community_id: { type: Sequelize.STRING, allowNull: false },
      thread_id: { type: Sequelize.INTEGER, allowNull: true },
      proposal_id: { type: Sequelize.STRING, allowNull: true },
      comment_id: { type: Sequelize.INTEGER, allowNull: true },
      address_id: { type: Sequelize.INTEGER, allowNull: false },
      reaction: { type: Sequelize.ENUM('like'), allowNull: false },
      calculated_voting_weight: { type: Sequelize.INTEGER, allowNull: true },
      // signed data
      canvas_action: { type: Sequelize.JSONB, allowNull: true },
      canvas_session: { type: Sequelize.JSONB, allowNull: true },
      canvas_hash: { type: Sequelize.STRING, allowNull: true },
    },
    {
      hooks: {
        afterCreate: async (reaction: ReactionInstance, options) => {
          let thread_id = reaction.thread_id;
          const comment_id = reaction.comment_id;
          const { Thread, Comment, Outbox } = sequelize.models;
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
                if (reaction.reaction === 'like') {
                  await emitEvent(
                    Outbox,
                    [
                      {
                        event_name: EventNames.ThreadUpvoted,
                        event_payload: reaction.get({ plain: true }),
                      },
                    ],
                    options.transaction,
                  );
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
        { fields: ['thread_id'] },
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
          name: 'reactions_unique',
          unique: true,
        },
        { fields: ['community_id', 'thread_id'] },
        { fields: ['community_id', 'comment_id'] },
      ],
    },
  );
