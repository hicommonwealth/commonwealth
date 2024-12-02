import { Vote } from '@hicommonwealth/schemas';
import Sequelize from 'sequelize';
import { z } from 'zod';
import type { ModelInstance } from './types';

export type VoteAttributes = z.infer<typeof Vote>;

export type VoteInstance = ModelInstance<VoteAttributes>;

export default (
  sequelize: Sequelize.Sequelize,
): Sequelize.ModelStatic<VoteInstance> =>
  sequelize.define<VoteInstance>(
    'Vote',
    {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      poll_id: { type: Sequelize.INTEGER, allowNull: false },
      option: { type: Sequelize.STRING, allowNull: false },
      address: { type: Sequelize.STRING, allowNull: false },
      author_community_id: { type: Sequelize.STRING, allowNull: true },
      community_id: { type: Sequelize.STRING, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    },
    {
      tableName: 'Votes',
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  );
