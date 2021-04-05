import * as Sequelize from 'sequelize';

import { OffchainThreadAttributes } from './offchain_thread';

export interface OffchainVoteAttributes {
  id?: number;
  thread_id: number;
  choice: string;
  created_at?: Date;
  updated_at?: Date;

  // associations
  thread?: OffchainThreadAttributes | OffchainThreadAttributes['id'];
}

export interface OffchainVoteInstance
extends Sequelize.Instance<OffchainVoteAttributes>, OffchainVoteAttributes {
}

export interface OffchainVoteModel extends Sequelize.Model<
  OffchainVoteInstance, OffchainVoteAttributes
> {
}

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: Sequelize.DataTypes,
): OffchainVoteModel => {
  const OffchainVote = sequelize.define<OffchainVoteInstance, OffchainVoteAttributes>(
    'OffchainVote', {
      id: { type: dataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      thread_id: { type: dataTypes.INTEGER, allowNull: false },
      choice: { type: dataTypes.STRING, allowNull: false },
      created_at: { type: dataTypes.DATE, allowNull: false },
      updated_at: { type: dataTypes.DATE, allowNull: false },
    }, {
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
