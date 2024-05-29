import Sequelize from 'sequelize';
import type { PollAttributes } from './poll';
import type { ModelInstance } from './types';

export type VoteAttributes = {
  poll_id: number;
  option: string;
  address: string;
  author_community_id: string;
  community_id: string;
  id?: number;
  created_at?: Date;
  updated_at?: Date;

  // associations
  poll?: PollAttributes;
};

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
