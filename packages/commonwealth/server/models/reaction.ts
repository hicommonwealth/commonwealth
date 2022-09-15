import * as Sequelize from 'sequelize';
import { DataTypes, Model } from 'sequelize';
import { ModelStatic, ModelInstance } from './types';
import { ChainAttributes } from './chain';
import { AddressAttributes } from './address';

export type ReactionAttributes = {
  address_id: number;
  reaction: string;
  id?: number;
  chain: string;
  thread_id?: number;
  proposal_id?: number;
  comment_id?: number;

  signature: string;
  signed_data: string;
  signed_hash: string;

  created_at?: Date;
  updated_at?: Date;

  Chain?: ChainAttributes;
  Address?: AddressAttributes;
}

export type ReactionInstance = ModelInstance<ReactionAttributes>;

export type ReactionModelStatic = ModelStatic<ReactionInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes,
): ReactionModelStatic => {
  const Reaction = <ReactionModelStatic>sequelize.define('Reaction', {
    id: { type: dataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    chain: { type: dataTypes.STRING, allowNull: false },
    thread_id: { type: dataTypes.INTEGER, allowNull: true },
    proposal_id: { type: dataTypes.STRING, allowNull: true },
    comment_id: { type: dataTypes.INTEGER, allowNull: true },
    address_id: { type: dataTypes.INTEGER, allowNull: false },
    reaction: { type: dataTypes.STRING, allowNull: false },
    // signed data
    signature: { type: dataTypes.STRING, allowNull: true },
    signed_data: { type: dataTypes.TEXT, allowNull: true },
    signed_hash: { type: dataTypes.STRING, allowNull: true },
  }, {
    tableName: 'Reactions',
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
      { fields: ['signed_hash'] },
    ],
  });

  Reaction.associate = (models) => {
    models.Reaction.belongsTo(models.Chain, { foreignKey: 'chain', targetKey: 'id' });
    models.Reaction.belongsTo(models.Address, { foreignKey: 'address_id', targetKey: 'id' });
    models.Reaction.belongsTo(models.Comment, { foreignKey: 'comment_id', targetKey: 'id' });
    models.Reaction.belongsTo(models.Thread, { foreignKey: 'thread_id', targetKey: 'id' });
  };

  return Reaction;
};
