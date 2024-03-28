import { schemas } from '@hicommonwealth/core';
import type * as Sequelize from 'sequelize';
import type { DataTypes } from 'sequelize';
import { z } from 'zod';
import type { AddressAttributes } from './address';
import type { CommunityAttributes } from './community';
import { NotificationAttributes } from './notification';
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

export type ThreadAttributes = z.infer<typeof schemas.entities.Thread> & {
  // associations
  Community?: CommunityAttributes;
  Address?: AddressAttributes;
  collaborators?: AddressAttributes[];
  topic?: TopicAttributes;
  Notifications?: NotificationAttributes[];
};

export type ThreadInstance = ModelInstance<ThreadAttributes> & {
  // no mixins used
};

export type ThreadModelStatic = ModelStatic<ThreadInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes,
): ThreadModelStatic => {
  const Thread = <ThreadModelStatic>sequelize.define(
    'Thread',
    {
      id: { type: dataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      address_id: { type: dataTypes.INTEGER, allowNull: true },
      created_by: { type: dataTypes.STRING, allowNull: true },
      title: { type: dataTypes.TEXT, allowNull: false },
      body: { type: dataTypes.TEXT, allowNull: true },
      plaintext: { type: dataTypes.TEXT, allowNull: true },
      kind: { type: dataTypes.TEXT, allowNull: false },
      stage: {
        type: dataTypes.TEXT,
        allowNull: false,
        defaultValue: 'discussion',
      },
      url: { type: dataTypes.TEXT, allowNull: true },
      topic_id: { type: dataTypes.INTEGER, allowNull: true },
      pinned: {
        type: dataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      community_id: { type: dataTypes.STRING, allowNull: false },
      view_count: {
        type: dataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      read_only: {
        type: dataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      version_history: {
        type: dataTypes.ARRAY(dataTypes.TEXT),
        defaultValue: [],
        allowNull: false,
      },
      links: { type: dataTypes.JSONB, allowNull: true },
      discord_meta: { type: dataTypes.JSONB, allowNull: true },
      has_poll: { type: dataTypes.BOOLEAN, allowNull: true },

      // signed data
      canvas_action: { type: dataTypes.JSONB, allowNull: true },
      canvas_session: { type: dataTypes.JSONB, allowNull: true },
      canvas_hash: { type: dataTypes.STRING, allowNull: true },
      // timestamps
      created_at: { type: dataTypes.DATE, allowNull: false },
      updated_at: { type: dataTypes.DATE, allowNull: false },
      last_edited: { type: dataTypes.DATE, allowNull: true },
      deleted_at: { type: dataTypes.DATE, allowNull: true },
      last_commented_on: { type: dataTypes.DATE, allowNull: true },
      marked_as_spam_at: { type: dataTypes.DATE, allowNull: true },
      archived_at: { type: dataTypes.DATE, allowNull: true },
      locked_at: {
        type: dataTypes.DATE,
        allowNull: true,
      },

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
      comment_count: {
        type: dataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },

      //notifications
      max_notif_id: {
        type: dataTypes.INTEGER,
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
          // when thread created, increment Community.thread_count
          await sequelize.query(
            `
            UPDATE "Communities"
            SET thread_count = thread_count + 1
            WHERE id = :communityId
          `,
            {
              replacements: {
                communityId: thread.community_id,
              },
              transaction: options.transaction,
            },
          );
        },
        afterDestroy: async (
          thread: ThreadInstance,
          options: Sequelize.InstanceDestroyOptions,
        ) => {
          // when thread deleted, decrement Community.thread_count
          await sequelize.query(
            `
            UPDATE "Communities"
            SET thread_count = thread_count - 1
            WHERE id = :communityId
          `,
            {
              replacements: {
                communityId: thread.community_id,
              },
              transaction: options.transaction,
            },
          );
        },
      },
    },
  );

  Thread.associate = (models) => {
    models.Thread.belongsTo(models.Community, {
      foreignKey: 'community_id',
      targetKey: 'id',
      as: 'Community',
    });
    models.Thread.belongsTo(models.Address, {
      as: 'Address',
      foreignKey: 'address_id',
      targetKey: 'id',
    });
    models.Thread.hasMany(models.Comment, {
      foreignKey: 'thread_id',
      constraints: false,
    });
    models.Thread.belongsTo(models.Topic, {
      as: 'topic',
      foreignKey: 'topic_id',
    });
    models.Thread.belongsToMany(models.Address, {
      through: models.Collaboration,
      as: 'collaborators',
    });
    models.Thread.hasMany(models.Reaction, {
      foreignKey: 'thread_id',
      as: 'reactions',
    });
    models.Thread.hasMany(models.Collaboration);
    models.Thread.hasMany(models.Poll, {
      foreignKey: 'thread_id',
    });
    models.Thread.hasMany(models.Notification, {
      foreignKey: 'thread_id',
    });
  };

  return Thread;
};
