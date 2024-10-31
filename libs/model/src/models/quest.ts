import * as schemas from '@hicommonwealth/schemas';
import Sequelize from 'sequelize';
import { z } from 'zod';
import type { ModelInstance } from './types';

export type QuestAttributes = z.infer<typeof schemas.Quest>;
export type QuestInstance = ModelInstance<QuestAttributes>;

export const Quest = (
  sequelize: Sequelize.Sequelize,
): Sequelize.ModelStatic<QuestInstance> =>
  sequelize.define<QuestInstance>(
    'Quest',
    {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      community_id: { type: Sequelize.STRING, allowNull: false },
      name: { type: Sequelize.STRING, allowNull: false },
      description: { type: Sequelize.STRING, allowNull: false },
      start_date: { type: Sequelize.DATE, allowNull: false },
      end_date: { type: Sequelize.DATE, allowNull: false },
    },
    {
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
      tableName: 'Quests',
      indexes: [{ fields: ['name', 'community_id'], unique: true }],
    },
  );

export type QuestActionMetaAttributes = z.infer<typeof schemas.QuestActionMeta>;
export type QuestActionMetaInstance = ModelInstance<QuestActionMetaAttributes>;

export const QuestActionMeta = (
  sequelize: Sequelize.Sequelize,
): Sequelize.ModelStatic<QuestActionMetaInstance> =>
  sequelize.define<QuestActionMetaInstance>(
    'QuestActionMeta',
    {
      quest_id: { type: Sequelize.INTEGER, allowNull: false, primaryKey: true },
      event_name: { type: Sequelize.ENUM, allowNull: false, primaryKey: true },
      reward_amount: { type: Sequelize.INTEGER, allowNull: false },
      creator_reward_weight: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      participation_limit: {
        type: Sequelize.ENUM,
        values: Object.values(schemas.QuestParticipationLimit),
        allowNull: true,
      },
      participation_period: {
        type: Sequelize.ENUM,
        values: Object.values(schemas.QuestParticipationPeriod),
        allowNull: true,
      },
      participation_times_per_period: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
    },
    {
      timestamps: true,
      createdAt: 'created_at',
      underscored: true,
      tableName: 'QuestActionMetas',
    },
  );

export type QuestActionAttributes = z.infer<typeof schemas.QuestAction>;
export type QuestActionInstance = ModelInstance<QuestActionAttributes>;

export const QuestAction = (
  sequelize: Sequelize.Sequelize,
): Sequelize.ModelStatic<QuestActionInstance> =>
  sequelize.define<QuestActionInstance>(
    'Quest',
    {
      user_id: { type: Sequelize.INTEGER, allowNull: false, primaryKey: true },
      quest_id: { type: Sequelize.INTEGER, allowNull: false, primaryKey: true },
      event_name: {
        type: Sequelize.STRING,
        allowNull: false,
        primaryKey: true,
      },
      creator_id: { type: Sequelize.INTEGER, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
    },
    {
      timestamps: true,
      createdAt: 'created_at',
      underscored: true,
      tableName: 'QuestActions',
    },
  );
