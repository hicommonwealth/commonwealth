import { Poll } from '@hicommonwealth/schemas';
import Sequelize from 'sequelize';
import { z } from 'zod';
import type { ModelInstance } from './types';

export type PollAttributes = z.infer<typeof Poll>;

export type PollInstance = ModelInstance<PollAttributes>;

export default (
  sequelize: Sequelize.Sequelize,
): Sequelize.ModelStatic<PollInstance> =>
  sequelize.define<PollInstance>(
    'Poll',
    {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      thread_id: { type: Sequelize.INTEGER, allowNull: false },
      community_id: { type: Sequelize.STRING, allowNull: false },

      prompt: { type: Sequelize.STRING, allowNull: false },
      options: { type: Sequelize.STRING, allowNull: false },
      ends_at: { type: Sequelize.DATE, allowNull: true },

      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: true },
    },
    {
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
      tableName: 'Polls',
      indexes: [{ fields: ['thread_id'] }, { fields: ['community_id'] }],
    },
  );
