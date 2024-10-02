import { EventNames } from '@hicommonwealth/core';
import { Thread } from '@hicommonwealth/schemas';
import { getDecodedString } from '@hicommonwealth/shared';
import Sequelize from 'sequelize';
import { z } from 'zod';
import { emitEvent, getThreadContestManagers } from '../utils/utils';
import type { CommunityAttributes } from './community';
import type { ThreadSubscriptionAttributes } from './thread_subscriptions';
import type { ModelInstance } from './types';

export type ThreadAttributes = z.infer<typeof Thread> & {
  // associations
  Community?: CommunityAttributes;
  subscriptions?: ThreadSubscriptionAttributes[];
};
export type ThreadInstance = ModelInstance<ThreadAttributes>;

export default (
  sequelize: Sequelize.Sequelize,
): Sequelize.ModelStatic<ThreadInstance> =>
  sequelize.define<ThreadInstance>(
    'Thread',
    {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      address_id: { type: Sequelize.INTEGER, allowNull: true },
      created_by: { type: Sequelize.STRING, allowNull: true },
      title: { type: Sequelize.TEXT, allowNull: false },
      body: { type: Sequelize.TEXT, allowNull: true },
      plaintext: { type: Sequelize.TEXT, allowNull: true },
      kind: { type: Sequelize.STRING, allowNull: false },
      stage: {
        type: Sequelize.TEXT,
        allowNull: false,
        defaultValue: 'discussion',
      },
      url: { type: Sequelize.TEXT, allowNull: true },
      topic_id: { type: Sequelize.INTEGER, allowNull: true },
      pinned: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      community_id: { type: Sequelize.STRING, allowNull: false },
      view_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      read_only: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      links: { type: Sequelize.JSONB, allowNull: true },
      discord_meta: { type: Sequelize.JSONB, allowNull: true },
      has_poll: { type: Sequelize.BOOLEAN, allowNull: true },

      // canvas-related columns
      canvas_signed_data: { type: Sequelize.JSONB, allowNull: true },
      canvas_msg_id: { type: Sequelize.STRING, allowNull: true },
      // timestamps
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
      last_edited: { type: Sequelize.DATE, allowNull: true },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
      last_commented_on: { type: Sequelize.DATE, allowNull: true },
      marked_as_spam_at: { type: Sequelize.DATE, allowNull: true },
      archived_at: { type: Sequelize.DATE, allowNull: true },
      locked_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },

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
      comment_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      activity_rank_date: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: new Date(),
      },
      search: {
        type: Sequelize.TSVECTOR,
        allowNull: false,
      },
      content_url: { type: Sequelize.STRING, allowNull: true },
    },
    {
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
      underscored: true,
      tableName: 'Threads',
      paranoid: true,
      indexes: [
        { fields: ['address_id'] },
        { fields: ['community_id'] },
        { fields: ['community_id', 'created_at'] },
        { fields: ['community_id', 'updated_at'] },
        { fields: ['community_id', 'pinned'] },
        { fields: ['community_id', 'has_poll'] },
        { fields: ['canvas_msg_id'] },
      ],
      hooks: {
        afterCreate: async (
          thread: ThreadInstance,
          options: Sequelize.CreateOptions<ThreadAttributes>,
        ) => {
          const { Community, Outbox } = sequelize.models;

          await Community.increment('lifetime_thread_count', {
            by: 1,
            where: { id: thread.community_id },
            transaction: options.transaction,
          });

          const { topic_id, community_id } = thread.get({
            plain: true,
          });
          const contestManagers = !topic_id
            ? []
            : await getThreadContestManagers(sequelize, topic_id, community_id);

          await emitEvent(
            Outbox,
            [
              {
                event_name: EventNames.ThreadCreated,
                event_payload: {
                  ...thread.get({ plain: true }),
                  contestManagers,
                },
              },
            ],
            options.transaction,
          );
        },
        afterDestroy: async (
          thread: ThreadInstance,
          options: Sequelize.InstanceDestroyOptions,
        ) => {
          const { Community } = sequelize.models;
          await Community.decrement('lifetime_thread_count', {
            by: 1,
            where: { id: thread.community_id },
            transaction: options.transaction,
          });
        },
      },
    },
  );

export function getThreadSearchVector(title: string, body: string) {
  return Sequelize.fn(
    'to_tsvector',
    'english',
    getDecodedString(title) + ' ' + getDecodedString(body),
  );
}
