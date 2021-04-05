import * as Sequelize from 'sequelize';

import { OffchainPollAttributes } from './offchain_poll';

export interface OffchainVoteAttributes {
  id?: number;
  poll_id: number;
  choice: string;
  created_at?: Date;
  updated_at?: Date;

  // associations
  poll?: OffchainPollAttributes | OffchainPollAttributes['id'];
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
      poll_id: { type: dataTypes.INTEGER, allowNull: false },
      choice: { type: dataTypes.STRING, allowNull: false },
      created_at: { type: dataTypes.DATE, allowNull: false },
      updated_at: { type: dataTypes.DATE, allowNull: false },
    }, {
      underscored: true,
      indexes: [
        { fields: ['poll_id'] },
      ],
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
