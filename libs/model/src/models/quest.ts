import { Quest } from '@hicommonwealth/schemas';
import Sequelize from 'sequelize';
import { z } from 'zod';
import type { ModelInstance } from './types';

export type QuestAttributes = z.infer<typeof Quest>;
export type QuestInstance = ModelInstance<QuestAttributes>;

export default (
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
      scores: { type: Sequelize.JSON, allowNull: true },
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
