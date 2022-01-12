import * as Sequelize from 'sequelize';
import { DataTypes, Model } from 'sequelize';
import { ModelStatic } from './types';
import { ChainAttributes } from './chain';
import { AddressAttributes } from './address';

export interface OffchainReactionAttributes {
  address_id: number;
  reaction: string;
  id?: number;
  chain: string;
  thread_id?: number;
  proposal_id?: number;
  comment_id?: number;
  created_at?: Date;
  updated_at?: Date;
  Chain?: ChainAttributes;
  Address?: AddressAttributes;
}

export interface OffchainReactionInstance
extends Model<OffchainReactionAttributes>, OffchainReactionAttributes {}

export type OffchainReactionModelStatic = ModelStatic<OffchainReactionInstance>

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes,
): OffchainReactionModelStatic => {
  const OffchainReaction = <OffchainReactionModelStatic>sequelize.define('OffchainReaction', {
    id: { type: dataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    chain: { type: dataTypes.STRING, allowNull: false },
    thread_id: { type: dataTypes.INTEGER, allowNull: true },
    proposal_id: { type: dataTypes.STRING, allowNull: true },
    comment_id: { type: dataTypes.INTEGER, allowNull: true },
    address_id: { type: dataTypes.INTEGER, allowNull: false },
    reaction: { type: dataTypes.STRING, allowNull: false },
  }, {
    tableName: 'OffchainReactions',
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['id'] },
      { fields: ['chain', 'thread_id', 'proposal_id', 'comment_id'] },
      { fields: ['address_id'] },
      { fields: ['chain', 'address_id', 'thread_id', 'proposal_id', 'comment_id', 'reaction'], unique: true },
      { fields: ['chain', 'thread_id'] },
      { fields: ['chain', 'comment_id'] },
    ],
  });

  OffchainReaction.associate = (models) => {
    models.OffchainReaction.belongsTo(models.Chain, { foreignKey: 'chain', targetKey: 'id' });
    models.OffchainReaction.belongsTo(models.Address, { foreignKey: 'address_id', targetKey: 'id' });
    models.OffchainReaction.belongsTo(models.OffchainComment, { foreignKey: 'comment_id', targetKey: 'id' });
    models.OffchainReaction.belongsTo(models.OffchainThread, { foreignKey: 'thread_id', targetKey: 'id' });
  };

  return OffchainReaction;
};
