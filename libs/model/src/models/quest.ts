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
      name: { type: Sequelize.STRING, allowNull: false },
      description: { type: Sequelize.STRING, allowNull: false },
      image_url: { type: Sequelize.STRING, allowNull: false },
      start_date: { type: Sequelize.DATE, allowNull: false },
      end_date: { type: Sequelize.DATE, allowNull: false },
      xp_awarded: { type: Sequelize.INTEGER, allowNull: false },
      max_xp_to_end: { type: Sequelize.INTEGER, allowNull: false },
      community_id: { type: Sequelize.STRING, allowNull: true },
      quest_type: { type: Sequelize.STRING, allowNull: false },
      scheduled_job_id: { type: Sequelize.STRING, allowNull: true },
    },
    {
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
      tableName: 'Quests',
      defaultScope: {
        attributes: { exclude: ['scheduled_job_id'] },
      },
      scopes: {
        withPrivateData: {},
      },
      indexes: [
        {
          name: 'Quests_community_id_name_key',
          fields: ['community_id', 'name'],
          unique: true,
        },
      ],
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
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      quest_id: { type: Sequelize.INTEGER, allowNull: false },
      event_name: { type: Sequelize.STRING, allowNull: false },
      reward_amount: { type: Sequelize.INTEGER, allowNull: false },
      creator_reward_weight: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      amount_multiplier: {
        type: Sequelize.FLOAT,
        allowNull: true,
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
      instructions_link: { type: Sequelize.STRING, allowNull: true },
      content_id: { type: Sequelize.STRING, allowNull: true },
      start_link: { type: Sequelize.STRING, allowNull: true },
    },
    {
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
      tableName: 'QuestActionMetas',
    },
  );
