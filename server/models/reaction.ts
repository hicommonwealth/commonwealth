import * as Sequelize from 'sequelize';
import { DataTypes, Model } from 'sequelize';
import { ModelStatic, ModelInstance } from './types';
import { CommunityAttributes } from './community';
import { AddressAttributes } from './address';

export type ReactionAttributes = {
  address_id: number;
  reaction: string;
  id?: number;
  community_id: string;
  thread_id?: number;
  proposal_id?: number;
  comment_id?: number;
  created_at?: Date;
  updated_at?: Date;
  Community?: CommunityAttributes;
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
    community_id: { type: dataTypes.STRING, allowNull: false },
    thread_id: { type: dataTypes.INTEGER, allowNull: true },
    proposal_id: { type: dataTypes.STRING, allowNull: true },
    comment_id: { type: dataTypes.INTEGER, allowNull: true },
    address_id: { type: dataTypes.INTEGER, allowNull: false },
    reaction: { type: dataTypes.STRING, allowNull: false },
  }, {
    tableName: 'Reactions',
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['id'] },
      { fields: ['community_id', 'thread_id', 'proposal_id', 'comment_id'] },
      { fields: ['address_id'] },
      { fields: ['community_id', 'address_id', 'thread_id', 'proposal_id', 'comment_id', 'reaction'], unique: true },
      { fields: ['community_id', 'thread_id'] },
      { fields: ['community_id', 'comment_id'] },
    ],
  });

  Reaction.associate = (models) => {
    models.Reaction.belongsTo(models.Community, { foreignKey: 'community_id', targetKey: 'id' });
    models.Reaction.belongsTo(models.Address, { foreignKey: 'address_id', targetKey: 'id' });
    models.Reaction.belongsTo(models.Comment, { foreignKey: 'comment_id', targetKey: 'id' });
    models.Reaction.belongsTo(models.Thread, { foreignKey: 'thread_id', targetKey: 'id' });
  };

  return Reaction;
};
