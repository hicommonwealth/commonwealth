import type { DataTypes } from 'sequelize';
import * as Sequelize from 'sequelize';
import type { PollAttributes } from './poll';
import type { ModelInstance, ModelStatic } from './types';

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

export type VoteModelStatic = ModelStatic<VoteInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes,
): VoteModelStatic => {
  const Vote = <VoteModelStatic>sequelize.define(
    'Vote',
    {
      id: { type: dataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      poll_id: { type: dataTypes.INTEGER, allowNull: false },
      option: { type: dataTypes.STRING, allowNull: false },
      address: { type: Sequelize.STRING, allowNull: false },
      author_community_id: { type: Sequelize.STRING, allowNull: true },
      community_id: { type: Sequelize.STRING, allowNull: false },
      created_at: { type: dataTypes.DATE, allowNull: false },
      updated_at: { type: dataTypes.DATE, allowNull: false },
    },
    {
      tableName: 'Votes',
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  );

  Vote.associate = (models) => {
    models.Vote.belongsTo(models.Poll, {
      foreignKey: 'poll_id',
      constraints: false,
      as: 'poll',
    });
  };

  return Vote;
};
