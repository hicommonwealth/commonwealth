import * as Sequelize from 'sequelize';

import { ChainAttributes } from './chain';
import { OffchainThreadAttributes } from './offchain_thread';
import { ChainEventAttributes } from './chain_event';

export interface ChainEntityAttributes {
  id?: number;
  chain: string;
  type: string;
  type_id: string;
  thread_id?: number;
  completed?: boolean;
  created_at?: Date;
  updated_at?: Date;

  Chain?: ChainAttributes;
  OffchainThread?: OffchainThreadAttributes;
  ChainEvents?: ChainEventAttributes[];
}

export interface ChainEntityInstance
extends Sequelize.Instance<ChainEntityAttributes>, ChainEntityAttributes {

}

export interface ChainEntityModel extends Sequelize.Model<ChainEntityInstance, ChainEntityAttributes> {

}
export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: Sequelize.DataTypes,
): ChainEntityModel => {
  const ChainEntity = sequelize.define<ChainEntityInstance, ChainEntityAttributes>('ChainEntity', {
    id: { type: dataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    chain: { type: dataTypes.STRING, allowNull: false },
    type: { type: dataTypes.STRING, allowNull: false },
    type_id: { type: dataTypes.STRING, allowNull: false },
    thread_id: { type: dataTypes.INTEGER, allowNull: true },
    completed: { type: dataTypes.BOOLEAN, allowNull: false, defaultValue: false },

    created_at: { type: dataTypes.DATE, allowNull: false },
    updated_at: { type: dataTypes.DATE, allowNull: false },
  }, {
    timestamps: true,
    underscored: true,
    paranoid: false,
    indexes: [
      { fields: ['id'] },
      { fields: ['chain', 'type', 'id' ] },
    ],
  });

  ChainEntity.associate = (models) => {
    models.ChainEntity.belongsTo(models.Chain, { foreignKey: 'chain', targetKey: 'id' });
    models.ChainEntity.belongsTo(models.OffchainThread, { foreignKey: 'thread_id', targetKey: 'id' });
    models.ChainEntity.hasMany(models.OffchainReaction, { foreignKey: 'proposal_id' });
    models.ChainEntity.hasMany(models.ChainEvent, { foreignKey: 'entity_id' });
  };

  return ChainEntity;
};
