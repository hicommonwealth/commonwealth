import * as Sequelize from 'sequelize';

import { ChainAttributes } from './chain';
import { OffchainCommunityAttributes } from './offchain_community';
import { AddressAttributes } from './address';

export interface OffchainReactionAttributes {
  id?: number;
  chain?: string;
  object_id: string;
  address_id: number;
  reaction: string;
  community?: string;
  created_at?: Date;
  updated_at?: Date;
  Chain?: ChainAttributes;
  OffchainCommunity?: OffchainCommunityAttributes;
  Address?: AddressAttributes;
}

export interface OffchainReactionInstance
extends Sequelize.Instance<OffchainReactionAttributes>, OffchainReactionAttributes {

}

export interface OffchainReactionModel extends Sequelize.Model<OffchainReactionInstance, OffchainReactionAttributes> {

}

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: Sequelize.DataTypes,
): OffchainReactionModel => {
  const OffchainReaction = sequelize.define<OffchainReactionInstance, OffchainReactionAttributes>('OffchainReaction', {
    id: { type: dataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    chain: { type: dataTypes.STRING, allowNull: true },
    object_id: { type: dataTypes.STRING, allowNull: false },
    address_id: { type: dataTypes.INTEGER, allowNull: false },
    reaction: { type: dataTypes.STRING, allowNull: false },
    community: { type: dataTypes.STRING, allowNull: true },
  }, {
    underscored: true,
    indexes: [
      { fields: ['id'] },
      { fields: ['chain', 'object_id'] },
      { fields: ['address_id'] },
      { fields: ['chain', 'address_id', 'object_id', 'reaction'], unique: true },
    ],
  });

  OffchainReaction.associate = (models) => {
    models.OffchainReaction.belongsTo(models.Chain, { foreignKey: 'chain', targetKey: 'id' });
    models.OffchainReaction.belongsTo(models.OffchainCommunity, { foreignKey: 'community', targetKey: 'id' });
    models.OffchainReaction.belongsTo(models.Address);
  };

  return OffchainReaction;
};
