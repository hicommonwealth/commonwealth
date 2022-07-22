import * as Sequelize from 'sequelize';
import { DataTypes } from 'sequelize';
import { ModelStatic, ModelInstance } from './types';
import { ThreadAttributes } from './thread';
import { OffchainPollAttributes } from './offchain_poll';

export type OffchainVoteAttributes = {
  poll_id: number;
  option: string;
  address: string;
  author_chain: string;
  chain_id: string;
  id?: number;
  created_at?: Date;
  updated_at?: Date;

  // associations
  poll?: OffchainPollAttributes;
};

export type OffchainVoteInstance = ModelInstance<OffchainVoteAttributes>;

export type OffchainVoteModelStatic = ModelStatic<OffchainVoteInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes
): OffchainVoteModelStatic => {
  const OffchainVote = <OffchainVoteModelStatic>sequelize.define(
    'OffchainVote',
    {
      id: { type: dataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      poll_id: { type: dataTypes.INTEGER, allowNull: false },
      option: { type: dataTypes.STRING, allowNull: false },
      address: { type: Sequelize.STRING, allowNull: false },
      author_chain: { type: Sequelize.STRING, allowNull: true },
      chain_id: { type: Sequelize.STRING, allowNull: true },
      created_at: { type: dataTypes.DATE, allowNull: false },
      updated_at: { type: dataTypes.DATE, allowNull: false },
    },
    {
      tableName: 'OffchainVotes',
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [{ fields: ['poll_id'] }],
    }
  );

  OffchainVote.associate = (models) => {
    models.OffchainVote.belongsTo(models.OffchainPoll, {
      foreignKey: 'poll_id',
      constraints: false,
      as: 'poll',
    });
  };

  return OffchainVote;
};
