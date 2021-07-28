import * as Sequelize from 'sequelize';
import { BuildOptions, DataTypes, Model } from 'sequelize';

import { OffchainThreadAttributes } from './offchain_thread';

export interface OffchainVoteAttributes {
  id?: number;
  thread_id: number;
  option: string;
  address: string;
  author_chain: string;
  chain: string;
  community: string;
  created_at?: Date;
  updated_at?: Date;

  // associations
  thread?: OffchainThreadAttributes | OffchainThreadAttributes['id'];
}

export interface OffchainVoteInstance
extends Model<OffchainVoteAttributes>, OffchainVoteAttributes {}

type OffchainVoteModelStatic = typeof Model
    & { associate: (models: any) => void }
    & { new(values?: Record<string, unknown>, options?: BuildOptions): OffchainVoteInstance }

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes,
): OffchainVoteModelStatic => {
  const OffchainVote = <OffchainVoteModelStatic>sequelize.define(
    'OffchainVote', {
      id: { type: dataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      thread_id: { type: dataTypes.INTEGER, allowNull: false },
      option: { type: dataTypes.STRING, allowNull: false },
      address: { type: Sequelize.STRING, allowNull: false },
      author_chain: { type: Sequelize.STRING, allowNull: true },
      chain: { type: Sequelize.STRING, allowNull: true },
      community: { type: Sequelize.STRING, allowNull: true },
      created_at: { type: dataTypes.DATE, allowNull: false },
      updated_at: { type: dataTypes.DATE, allowNull: false },
    }, {
      tableName: 'OffchainVotes',
      underscored: true,
      indexes: [
        { fields: ['thread_id'] },
      ],
    }
  );

  OffchainVote.associate = (models) => {
    models.OffchainVote.belongsTo(models.OffchainThread, {
      foreignKey: 'thread_id',
      constraints: false,
      as: 'thread',
    });
  };

  return OffchainVote;
};
