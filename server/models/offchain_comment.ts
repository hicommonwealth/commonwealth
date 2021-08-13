import * as Sequelize from 'sequelize';
import { Model, DataTypes } from 'sequelize';
import { ModelStatic } from './types';

import { AddressAttributes } from './address';
import { ChainAttributes } from './chain';
import { OffchainCommunityAttributes } from './offchain_community';
import { OffchainAttachmentAttributes } from './offchain_attachment';

export interface OffchainCommentAttributes {
  root_id: string;
  address_id: number;
  text: string;
  plaintext: string;
  id?: number;
  chain?: string;
  parent_id?: string;
  child_comments?: number[];
  community?: string;
  version_history?: string[];
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date;

  // associations
  Chain?: ChainAttributes;
  OffchainCommunity?: OffchainCommunityAttributes;
  Address?: AddressAttributes;
  OffchainAttachments?: OffchainAttachmentAttributes[] | OffchainAttachmentAttributes['id'][];
}

export interface OffchainCommentInstance
extends Model<OffchainCommentAttributes>, OffchainCommentAttributes {
  // no mixins used
}

export type OffchainCommentModelStatic =  ModelStatic<OffchainCommentInstance>

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes,
): OffchainCommentModelStatic => {
  const OffchainComment = <OffchainCommentModelStatic>sequelize.define('OffchainComment', {
    id: { type: dataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    chain: { type: dataTypes.STRING, allowNull: true },
    root_id: { type: dataTypes.STRING, allowNull: false },
    parent_id: { type: dataTypes.STRING, allowNull: true },
    child_comments: { type: dataTypes.ARRAY(dataTypes.INTEGER), allowNull: false, defaultValue: [] },
    address_id: { type: dataTypes.INTEGER, allowNull: false },
    text: { type: dataTypes.TEXT, allowNull: false },
    plaintext: { type: dataTypes.TEXT, allowNull: true },
    community: { type: dataTypes.STRING, allowNull: true },
    version_history: { type: dataTypes.ARRAY(dataTypes.TEXT), defaultValue: [], allowNull: false },
    created_at: { type: dataTypes.DATE, allowNull: false },
    updated_at: { type: dataTypes.DATE, allowNull: false },
    deleted_at: { type: dataTypes.DATE, allowNull: true },
  }, {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    tableName: 'OffchainComments',
    underscored: true,
    paranoid: true,
    indexes: [
      { fields: ['id'] },
      { fields: ['chain', 'root_id'] },
      { fields: ['address_id'] },
      { fields: ['chain', 'created_at'] },
      { fields: ['community', 'created_at'] },
      { fields: ['chain', 'updated_at'] },
      { fields: ['community', 'updated_at'] },
      { fields: ['root_id'] },
    ],
  });

  OffchainComment.associate = (models) => {
    models.OffchainComment.belongsTo(models.Chain, {
      foreignKey: 'chain',
      targetKey: 'id'
    });
    models.OffchainComment.belongsTo(models.OffchainCommunity, {
      foreignKey: 'community',
      targetKey: 'id'
    });
    models.OffchainComment.belongsTo(models.Address, {
      foreignKey: 'address_id',
      targetKey: 'id'
    });
    models.OffchainComment.hasMany(models.OffchainAttachment, {
      foreignKey: 'attachment_id',
      constraints: false,
      scope: {
        attachable: 'comment',
      },
    });
    models.OffchainComment.hasMany(models.OffchainReaction, {
      foreignKey: 'comment_id',
      as: 'reactions'
    });
  };

  return OffchainComment;
};
