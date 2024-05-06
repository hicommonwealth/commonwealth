import { EventNames } from '@hicommonwealth/core';
import { Thread } from '@hicommonwealth/schemas';
import Sequelize from 'sequelize';
import { z } from 'zod';
import { emitEvent } from '../utils';
import type { AddressAttributes } from './address';
import type { CommunityAttributes } from './community';
import type { NotificationAttributes } from './notification';
import type { ReactionAttributes } from './reaction';
import type { ThreadSubscriptionAttributes } from './thread_subscriptions';
import type { TopicAttributes } from './topic';
import type { ModelInstance, ModelStatic } from './types';

export enum LinkSource {
  Snapshot = 'snapshot',
  Proposal = 'proposal',
  Thread = 'thread',
  Web = 'web',
  Template = 'template',
}

export type Link = {
  source: LinkSource;
  identifier: string;
  title?: string;
};

export type ThreadAttributes = z.infer<typeof Thread> & {
  // associations
  Community?: CommunityAttributes;
  collaborators?: AddressAttributes[];
  topic?: TopicAttributes;
  Notifications?: NotificationAttributes[];
  reactions?: ReactionAttributes[];
  subscriptions?: ThreadSubscriptionAttributes[];
};

export type ThreadInstance = ModelInstance<ThreadAttributes> & {
  // no mixins used
};

export type ThreadModelStatic = ModelStatic<ThreadInstance>;

export default (sequelize: Sequelize.Sequelize) =>
  <ThreadModelStatic>sequelize.define<ThreadInstance>(
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
      version_history: {
        type: Sequelize.ARRAY(Sequelize.TEXT),
        defaultValue: [],
        allowNull: false,
      },
      links: { type: Sequelize.JSONB, allowNull: true },
      discord_meta: { type: Sequelize.JSONB, allowNull: true },
      has_poll: { type: Sequelize.BOOLEAN, allowNull: true },

      // signed data
      canvas_action: { type: Sequelize.JSONB, allowNull: true },
      canvas_session: { type: Sequelize.JSONB, allowNull: true },
      canvas_hash: { type: Sequelize.STRING, allowNull: true },
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

      //notifications
      max_notif_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
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
        { fields: ['canvas_hash'] },
      ],
      hooks: {
        afterCreate: async (
          thread: ThreadInstance,
          options: Sequelize.CreateOptions<ThreadAttributes>,
        ) => {
          const { Community, Outbox } = sequelize.models;

          await Community.increment('thread_count', {
            by: 1,
            where: { id: thread.community_id },
            transaction: options.transaction,
          });

          await emitEvent(
            Outbox,
            [
              {
                event_name: EventNames.ThreadCreated,
                event_payload: thread.get({ plain: true }),
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
          await Community.increment('thread_count', {
            by: 1,
            where: { id: thread.community_id },
            transaction: options.transaction,
          });
        },
      },
    },
  );
