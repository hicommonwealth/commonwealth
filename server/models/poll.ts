import * as Sequelize from 'sequelize';
import { DataTypes } from 'sequelize';
import { ModelStatic, ModelInstance } from './types';
import { ChainAttributes } from './chain';
import { OffchainThreadAttributes } from './offchain_thread';

export type PollAttributes = {
  id: number;
  chain_id: string;
  thread_id: number;
  prompt: string;
  options: string;
  ends_at: Date;

  created_at?: Date;
  updated_at?: Date;
  last_commented_on?: Date;

  // associations
  Thread: OffchainThreadAttributes;
  Chain: ChainAttributes;
};

export type PollInstance = ModelInstance<PollAttributes>;
export type PollModelStatic = ModelStatic<PollInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes
): PollModelStatic => {
  const Poll = <PollModelStatic>sequelize.define(
    'Poll',
    {
      id: { type: dataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      thread_id: { type: dataTypes.INTEGER, allowNull: false },
      chain_id: { type: dataTypes.STRING, allowNull: false },

      prompt: { type: dataTypes.TEXT, allowNull: false },
      options: { type: dataTypes.STRING, allowNull: true },
      ends_at: { type: dataTypes.DATE, allowNull: true },

      created_at: { type: dataTypes.DATE, allowNull: false },
      updated_at: { type: dataTypes.DATE, allowNull: false },
    },
    {
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
      tableName: 'Polls',
      indexes: [{ fields: ['thread_id'] }, { fields: ['chain_id'] }],
    }
  );

  Poll.associate = (models) => {
    models.Poll.belongsTo(models.OffchainThread, {
      foreignKey: 'thread_id',
      targetKey: 'id',
    });
    models.Poll.belongsTo(models.Chain, {
      foreignKey: 'chain_id',
      targetKey: 'id',
    });
    models.Poll.hasMany(models.Vote, {
      foreignKey: 'poll_id',
      as: 'votes',
    });
  };

  return Poll;
};
